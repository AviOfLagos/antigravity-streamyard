import { RoomStatus } from "@prisma/client"
import { NextResponse } from "next/server"

import { prisma } from "@/lib/prisma"
import { publishEvent } from "@/lib/redis"
import { LeaveRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(LeaveRequestSchema, body)
  if (!validation.success) return validation.response

  const { displayName, identity } = validation.data

  const room = await prisma.room.findUnique({ where: { code } })

  // Idempotent — if room is gone or already ended, guest is already gone
  if (!room || room.status === RoomStatus.ENDED) {
    return NextResponse.json({ ok: true })
  }

  // Update Participant.leftAt for matching identity in this room
  if (identity) {
    await prisma.participant.updateMany({
      where: { roomId: room.id, identity, leftAt: null },
      data: { leftAt: new Date() },
    })
  }

  await publishEvent(code, {
    type: "GUEST_LEFT",
    data: { participantId: displayName ?? "Guest" },
  })

  return NextResponse.json({ ok: true })
}
