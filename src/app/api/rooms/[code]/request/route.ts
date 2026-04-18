import { publishEvent, setPendingGuest } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { randomUUID } from "crypto"

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

  const guestId = randomUUID()
  await setPendingGuest(code, guestId, { name, requestedAt: Date.now() })
  await publishEvent(code, { type: "GUEST_REQUEST", data: { guestId, name } })

  return NextResponse.json({ guestId })
}
