import { RoomStatus } from "@prisma/client"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

import { getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { publishEvent, redis, setPendingGuest } from "@/lib/redis"
import { GuestRequestSchema, RoomCodeSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

const PENDING_NAMES_TTL = 60 * 60 * 6 // 6 hours

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Validate room code format
  const codeResult = RoomCodeSchema.safeParse(code)
  if (!codeResult.success) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  // Rate limit: 3 requests per minute per IP
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip, "rooms:request")
  if (!rl.success) {
    const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
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
  const validation = validateRequestBody(GuestRequestSchema, body)
  if (!validation.success) return validation.response

  const { name } = validation.data

  // Verify room is not ended (LOBBY and LIVE both accept guest requests)
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.status === RoomStatus.ENDED) {
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
