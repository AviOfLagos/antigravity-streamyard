import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { generateParticipantToken, getParticipantCount } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { deletePendingGuest, publishEvent, setApprovedGuest } from "@/lib/redis"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { guestId, name } = await req.json()

  // G06: guestId is required
  if (!guestId || typeof guestId !== "string") {
    return NextResponse.json({ error: "guestId is required" }, { status: 400 })
  }

  // Fetch room once — reused in both auth paths and the ended-room check
  const room = await prisma.room.findUnique({ where: { code } })

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
  if (!room || room.status === "ended") {
    return NextResponse.json({ error: "Room has ended" }, { status: 410 })
  }

  // ── Enforce 6-person limit ───────────────────────────────────────────────
  const count = await getParticipantCount(code)
  if (count >= 6) {
    return NextResponse.json({ error: "Room is full (max 6 participants)" }, { status: 400 })
  }

  const guestToken = await generateParticipantToken(code, guestId, name ?? "Guest")
  await setApprovedGuest(code, guestId, guestToken)
  await deletePendingGuest(code, guestId)
  await publishEvent(code, { type: "GUEST_ADMITTED", data: { guestId, token: guestToken } })

  return NextResponse.json({ ok: true })
}
