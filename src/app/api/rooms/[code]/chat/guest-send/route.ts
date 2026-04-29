import { NextResponse } from "next/server"
import { z } from "zod"

import { redis, publishChat } from "@/lib/redis"

const GuestSendSchema = z.object({
  message: z.string().min(1).max(500),
  displayName: z.string().min(1).max(64),
})

const ROOM_CODE_RE = /^[a-zA-Z0-9]{6,8}$/

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  if (!ROOM_CODE_RE.test(code)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = GuestSendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Verify the room exists in Redis before publishing
  const roomExists = await redis.exists(`room:${code}:info`).catch(() => 0)
  if (!roomExists) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  const { message, displayName } = parsed.data

  const guestMsg = {
    id: crypto.randomUUID(),
    platform: "guest" as const,
    author: { name: displayName },
    message,
    timestamp: new Date().toISOString(),
    eventType: "text" as const,
  }

  await publishChat(code, guestMsg)

  return NextResponse.json({ ok: true, messageId: guestMsg.id })
}
