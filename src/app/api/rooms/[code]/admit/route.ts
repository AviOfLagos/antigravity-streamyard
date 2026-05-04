import { ParticipantRole, RoomStatus } from "@prisma/client"
import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { generateParticipantToken, getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"
import { deletePendingGuest, publishEvent, redis, setApprovedGuest } from "@/lib/redis"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { AdmitGuestRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const blocked = await rateLimitGuard(getClientIp(req), "rooms:admit")
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(AdmitGuestRequestSchema, body)
  if (!validation.success) return validation.response

  const { guestId, name } = validation.data

  // Fetch room once — reused in both auth paths and the ended-room check
  const room = await getCachedRoom(code)

  // ── Auth: session OR LiveKit host JWT (for demo/direct access) ──────────
  let authorized = false

  const session = await auth()
  if (session?.user?.id) {
    if (room?.hostId === session.user.id) authorized = true
  }

  if (!authorized) {
    const authHeader = req.headers.get("authorization") ?? ""
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7)
      try {
        const apiSecret = process.env.LIVEKIT_API_SECRET
        if (!apiSecret) throw new Error("Missing LIVEKIT_API_SECRET")
        const secret = new TextEncoder().encode(apiSecret)
        const { payload } = await jwtVerify(token, secret)
        const video = payload.video as Record<string, unknown> | undefined
        if (video?.roomAdmin && typeof payload.sub === "string") {
          if (room?.hostId === payload.sub) authorized = true
        }
      } catch {
        // invalid token — keep unauthorized
      }
    }
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // G05: reject admit on an ended room (room is guaranteed non-null — authorization above confirmed hostId matches)
  if (!room || room.status === RoomStatus.ENDED) {
    return NextResponse.json({ error: "Room has ended" }, { status: 410 })
  }

  // ── Enforce 6-person limit ───────────────────────────────────────────────
  const count = await getParticipantCount(code)
  if (count >= 6) {
    return NextResponse.json({ error: "Room is full (max 6 participants)" }, { status: 400 })
  }

  const displayName = name ?? "Guest"
  const identity = `guest-${guestId}`
  const guestToken = await generateParticipantToken(code, guestId, displayName)
  await setApprovedGuest(code, guestId, guestToken)
  await deletePendingGuest(code, guestId)

  // Clean up pending-names so the name slot is freed
  await redis.srem(`room:${code}:pending-names`, displayName.trim())

  await publishEvent(code, { type: "GUEST_ADMITTED", data: { guestId, token: guestToken, identity, name: displayName } })

  // Create Participant record in DB
  await prisma.participant.create({
    data: {
      roomId: room.id,
      name: displayName,
      identity,
      role: ParticipantRole.GUEST,
    },
  })

  return NextResponse.json({ ok: true, identity })
}
