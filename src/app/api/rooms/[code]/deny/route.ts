import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { getCachedRoom } from "@/lib/room-cache"
import { deletePendingGuest, publishEvent, redis } from "@/lib/redis"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { DenyGuestRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const blocked = await rateLimitGuard(getClientIp(req), "rooms:deny")
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(DenyGuestRequestSchema, body)
  if (!validation.success) return validation.response

  const { guestId } = validation.data

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

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })

  await deletePendingGuest(code, guestId)
  await publishEvent(code, { type: "GUEST_DENIED", data: { guestId } })

  // Clean up pending name so the guest can re-request with the same name
  const pendingKey = `room:${code}:pending:${guestId}`
  const pendingRaw = await redis.get(pendingKey)
  if (pendingRaw) {
    const pending = typeof pendingRaw === "string" ? JSON.parse(pendingRaw) : pendingRaw
    if (pending?.name) {
      await redis.srem(`room:${code}:pending-names`, pending.name)
    }
  }

  return NextResponse.json({ ok: true })
}
