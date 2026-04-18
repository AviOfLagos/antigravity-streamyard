import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { publishEvent } from "@/lib/redis"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { displayName } = await req.json()

  const room = await prisma.room.findUnique({ where: { code } })

  // Idempotent — if room is gone or already ended, guest is already gone
  if (!room || room.status === "ended") {
    return NextResponse.json({ ok: true })
  }

  await publishEvent(code, {
    type: "GUEST_LEFT",
    data: { participantId: displayName ?? "Guest" },
  })

  return NextResponse.json({ ok: true })
}
