import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { closeLivekitRoom, getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { deleteRoomKeys, publishEvent, redis } from "@/lib/redis"

const SUMMARY_TTL = 60 * 60 * 24 // 24 hours

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // G09: idempotent — if already ended, return success immediately
  if (room.status === "ended") {
    return NextResponse.json({ ok: true })
  }

  const endedAt = new Date()
  const endedAtMs = endedAt.getTime()

  // G09: use updateMany with a status guard to win the race atomically
  const updated = await prisma.room.updateMany({
    where: { code, status: "active" },
    data: { status: "ended", endedAt },
  })
  if (updated.count === 0) {
    // Another request already ended the room
    return NextResponse.json({ ok: true })
  }

  // G10: use Promise.allSettled so a failure in one stat doesn't crash the whole response
  const [participantResult, messageResult, startTsResult] = await Promise.allSettled([
    getParticipantCount(code),
    redis.llen(`room:${code}:chat`),
    redis.get(`session:start:${code}`),
  ])

  const participantCount = participantResult.status === "fulfilled" ? participantResult.value : 0
  const messageCount = messageResult.status === "fulfilled" ? messageResult.value : 0
  // G08: fall back to room.createdAt (not endedAtMs) when session:start is missing
  const startTsRaw = startTsResult.status === "fulfilled" ? startTsResult.value : null
  const startTs = startTsRaw ? Number(startTsRaw) : room.createdAt.getTime()
  const durationSeconds = Math.floor((endedAtMs - startTs) / 1000)

  // Derive connected platforms from messages in chat list
  const chatRaw = await redis.lrange(`room:${code}:chat`, 0, -1)
  const platformSet = new Set<string>()
  for (const item of chatRaw) {
    const parsed = typeof item === "string" ? JSON.parse(item) : item
    if (parsed?.platform) platformSet.add(parsed.platform)
  }
  const platforms = Array.from(platformSet)

  // Save summary (24h TTL)
  const summary = {
    code,
    endedAt: endedAt.toISOString(),
    durationSeconds,
    participantCount,
    peakParticipants: participantCount,
    messageCount,
    platforms,
  }
  await redis.set(`session:summary:${code}`, JSON.stringify(summary), { ex: SUMMARY_TTL })

  // Notify all participants before cleanup
  await publishEvent(code, { type: "STUDIO_ENDED" })

  // Clean up LiveKit room (DB already updated above)
  await Promise.allSettled([closeLivekitRoom(code)])

  // Delay key deletion slightly so SSE clients can receive STUDIO_ENDED
  setTimeout(() => deleteRoomKeys(code), 5000)

  return NextResponse.json({ ok: true })
}
