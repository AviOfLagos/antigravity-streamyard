import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { deletePendingGuest, publishEvent } from "@/lib/redis"
import { DenyGuestRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(DenyGuestRequestSchema, body)
  if (!validation.success) return validation.response

  const { guestId } = validation.data

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await deletePendingGuest(code, guestId)
  await publishEvent(code, { type: "GUEST_DENIED", data: { guestId } })

  return NextResponse.json({ ok: true })
}
