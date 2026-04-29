import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { removeParticipant, sendDataToParticipant } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"
import { publishEvent } from "@/lib/redis"

import { z } from "zod"

const KickSchema = z.object({
  identity: z.string().min(1),
  name: z.string().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = KickSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing identity" }, { status: 400 })
  }

  const { identity, name } = parsed.data
  const room = await getCachedRoom(code)

  // ── Auth: session OR LiveKit host JWT ──────────────────────────────────
  let authorized = false

  const session = await auth()
  if (session?.user?.id && room?.hostId === session.user.id) {
    authorized = true
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
        // invalid token
      }
    }
  }

  if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 })

  // Prevent host from kicking themselves
  if (identity.startsWith("host-")) {
    return NextResponse.json({ error: "Cannot kick the host" }, { status: 400 })
  }

  // Send a KICKED data message to the participant BEFORE removing them.
  // This gives the client ~250ms to receive and set the wasKicked flag so the
  // disconnection handler can show the correct "you were removed" UI instead
  // of the generic "connection lost" screen.
  try {
    await sendDataToParticipant(code, identity, {
      type: "KICKED",
      reason: "removed_by_host",
    })
    // Brief delay — ensures the data message is flushed to the participant
    // before the WebRTC connection is torn down by removeParticipant.
    await new Promise((resolve) => setTimeout(resolve, 250))
  } catch (err) {
    // Non-fatal: participant may have already left or room may not exist.
    console.warn("[kick] sendDataToParticipant failed:", err)
  }

  try {
    await removeParticipant(code, identity)
  } catch (err) {
    // Participant may have already left
    console.warn("[kick] removeParticipant failed (may have already left):", err)
  }

  // Mark participant as left in DB
  await prisma.participant.updateMany({
    where: { roomId: room.id, identity, leftAt: null },
    data: { leftAt: new Date() },
  })

  await publishEvent(code, {
    type: "GUEST_LEFT",
    data: { participantId: identity, name: name ?? identity, reason: "kicked" },
  })

  return NextResponse.json({ ok: true })
}
