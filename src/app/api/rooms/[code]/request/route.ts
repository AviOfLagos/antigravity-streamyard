import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

import { getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { publishEvent, redis, setPendingGuest } from "@/lib/redis"

const PENDING_NAMES_TTL = 60 * 60 * 6 // 6 hours

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Verify room is active
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.status !== "active") {
    return NextResponse.json({ error: "Room not found or ended" }, { status: 404 })
  }

  // G03: reject if room is already full
  const count = await getParticipantCount(code)
  if (count >= 6) {
    return NextResponse.json({ error: "Room is full" }, { status: 400 })
  }

  // G04: reject duplicate pending request for the same name
  const pendingNamesKey = `room:${code}:pending-names`
  const alreadyPending = await redis.sismember(pendingNamesKey, name.trim())
  if (alreadyPending) {
    return NextResponse.json({ error: "You already have a pending request" }, { status: 409 })
  }

  const guestId = randomUUID()
  await setPendingGuest(code, guestId, { name, requestedAt: Date.now() })
  await publishEvent(code, { type: "GUEST_REQUEST", data: { guestId, name } })

  // Track pending name to prevent duplicates; expires with the room
  await redis.sadd(pendingNamesKey, name.trim())
  await redis.expire(pendingNamesKey, PENDING_NAMES_TTL)

  return NextResponse.json({ guestId })
}
