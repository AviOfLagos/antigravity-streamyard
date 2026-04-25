import { ParticipantRole, RoomStatus } from "@prisma/client"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"

import { generateParticipantToken, getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { publishEvent, redis, setApprovedGuest, setPendingGuest } from "@/lib/redis"
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

  const { name, email } = validation.data

  // Verify room is not ended (LOBBY and LIVE both accept guest requests)
  const room = await getCachedRoom(code)
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

  // Save guest lead (email + name) for marketing — fire and forget
  if (email) {
    prisma.guestLead.create({
      data: { roomId: room.id, name, email },
    }).catch((err) => {
      console.warn("[guestLead] Failed to save:", err)
    })
  }

  // Check if room has auto-admit enabled
  if (room.autoAdmit) {
    // Auto-admit: generate token immediately, skip pending queue
    const identity = `guest-${guestId}`
    const displayName = name ?? "Guest"
    const guestToken = await generateParticipantToken(code, guestId, displayName)
    await setApprovedGuest(code, guestId, guestToken)

    // Create Participant record in DB
    await prisma.participant.create({
      data: {
        roomId: room.id,
        name: displayName,
        identity,
        role: ParticipantRole.GUEST,
      },
    })

    // Publish admitted event so SSE listeners pick it up
    await publishEvent(code, {
      type: "GUEST_ADMITTED",
      data: { guestId, token: guestToken, identity, name: displayName },
    })

    return NextResponse.json({ guestId, autoAdmitted: true })
  }

  // Manual admit: add to pending queue
  await setPendingGuest(code, guestId, { name, email: email ?? null, requestedAt: Date.now() })
  await publishEvent(code, { type: "GUEST_REQUEST", data: { guestId, name } })

  // Track pending name to prevent duplicates; expires with the room
  await redis.sadd(pendingNamesKey, name.trim())
  await redis.expire(pendingNamesKey, PENDING_NAMES_TTL)

  return NextResponse.json({ guestId })
}
