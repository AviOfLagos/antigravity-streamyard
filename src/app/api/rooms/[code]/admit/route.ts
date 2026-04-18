import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getParticipantCount, generateParticipantToken } from "@/lib/livekit"
import { publishEvent, setApprovedGuest, deletePendingGuest } from "@/lib/redis"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const { guestId, name } = await req.json()

  // Verify this user is the host
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Enforce 6-person limit
  const count = await getParticipantCount(code)
  if (count >= 6) {
    return NextResponse.json({ error: "Room is full (max 6 participants)" }, { status: 400 })
  }

  const token = generateParticipantToken(code, guestId, name ?? "Guest")
  await setApprovedGuest(code, guestId, token)
  await deletePendingGuest(code, guestId)
  await publishEvent(code, { type: "GUEST_ADMITTED", data: { guestId, token } })

  return NextResponse.json({ ok: true })
}
