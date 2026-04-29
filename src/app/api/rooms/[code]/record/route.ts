import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { startRecording, stopRecording } from "@/lib/egress"
import { getCachedRoom } from "@/lib/room-cache"
import { checkRateLimit } from "@/lib/rate-limit"
import { publishEvent } from "@/lib/redis"

// ── POST — Start recording ─────────────────────────────────────────────────

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  // Rate limit: 5 per minute (shared with stream actions)
  const rl = await checkRateLimit(session.user.id, "rooms:record")
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

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const { egressId } = await startRecording(code)

    await publishEvent(code, {
      type: "RECORDING_STARTED",
      data: { egressId },
    })

    return NextResponse.json({ egressId, status: "recording" })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown egress error"
    console.error("[record] Failed to start recording:", err)
    return NextResponse.json(
      { error: "Failed to start recording", details: errorMessage },
      { status: 502 },
    )
  }
}

// ── DELETE — Stop recording ────────────────────────────────────────────────

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // egressId is required in the request body
  let egressId: string | undefined
  try {
    const body = await req.json()
    egressId = typeof body?.egressId === "string" ? body.egressId : undefined
  } catch {
    // no body
  }

  if (!egressId) {
    return NextResponse.json({ error: "egressId is required" }, { status: 400 })
  }

  try {
    const { downloadUrl } = await stopRecording(egressId)

    await publishEvent(code, {
      type: "RECORDING_STOPPED",
      data: { egressId, downloadUrl },
    })

    return NextResponse.json({ status: "stopped", downloadUrl })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error("[record] Failed to stop recording:", err)
    return NextResponse.json(
      { error: "Failed to stop recording", details: errorMessage },
      { status: 502 },
    )
  }
}
