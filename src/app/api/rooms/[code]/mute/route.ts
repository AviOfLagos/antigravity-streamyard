import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { listParticipants, muteParticipantTrack } from "@/lib/livekit"
import { getCachedRoom } from "@/lib/room-cache"

import { z } from "zod"

import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"

const MuteSchema = z.object({
  identity: z.string().min(1),
  trackType: z.enum(["audio", "video"]),
  muted: z.boolean(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  const blocked = await rateLimitGuard(getClientIp(req), "rooms:mute")
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const parsed = MuteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { identity, trackType, muted } = parsed.data
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

  // Find the participant's published tracks
  try {
    const participants = await listParticipants(code)
    const participant = participants.find((p) => p.identity === identity)
    if (!participant) {
      return NextResponse.json({ error: "Participant not found in room" }, { status: 404 })
    }

    // Find the matching track
    const targetSource = trackType === "audio" ? "MICROPHONE" : "CAMERA"
    const track = participant.tracks.find(
      (t) => t.source?.toString() === targetSource ||
             (trackType === "audio" && t.mimeType?.startsWith("audio/")) ||
             (trackType === "video" && t.mimeType?.startsWith("video/") && t.source?.toString() !== "SCREEN_SHARE")
    )

    if (!track?.sid) {
      return NextResponse.json({ error: `No ${trackType} track found` }, { status: 404 })
    }

    await muteParticipantTrack(code, identity, track.sid, muted)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[mute] failed:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mute participant" },
      { status: 500 }
    )
  }
}
