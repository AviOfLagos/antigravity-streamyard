import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { closeLivekitRoom } from "@/lib/livekit"
import { deleteRoomKeys, publishEvent } from "@/lib/redis"
import { NextResponse } from "next/server"

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

  // Notify all participants before cleanup
  await publishEvent(code, { type: "STUDIO_ENDED" })

  // Clean up
  await Promise.allSettled([
    closeLivekitRoom(code),
    prisma.room.update({ where: { code }, data: { status: "ended", endedAt: new Date() } }),
  ])

  // Delay key deletion slightly so SSE clients can receive STUDIO_ENDED
  setTimeout(() => deleteRoomKeys(code), 5000)

  return NextResponse.json({ ok: true })
}
