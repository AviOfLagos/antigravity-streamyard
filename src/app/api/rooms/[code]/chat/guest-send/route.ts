import { NextResponse } from "next/server"
import { z } from "zod"

import { redis, publishChat } from "@/lib/redis"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { stripHtml } from "@/lib/sanitize"

const GuestSendSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => stripHtml(val).trim()),
  displayName: z
    .string()
    .min(1)
    .max(64)
    .transform((val) => stripHtml(val).trim().slice(0, 50)),
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

  // Rate limit: 10 messages per 30 seconds per IP (guest, unauthenticated)
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, "guest:chat-send")
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many messages", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    )
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
