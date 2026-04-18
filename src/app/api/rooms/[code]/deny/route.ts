import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deletePendingGuest, publishEvent } from "@/lib/redis"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const { guestId } = await req.json()

  // G07: guestId is required
  if (!guestId || typeof guestId !== "string") {
    return NextResponse.json({ error: "guestId is required" }, { status: 400 })
  }

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deletePendingGuest(code, guestId)
  await publishEvent(code, { type: "GUEST_DENIED", data: { guestId } })

  return NextResponse.json({ ok: true })
}
