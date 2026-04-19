import { PlatformType, RoomStatus, StreamStatus } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { addDestination, removeDestination, startStream, stopStream } from "@/lib/egress"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { publishEvent } from "@/lib/redis"

// ── POST — Start streaming (Go Live) ──────────────────────────────────────

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  // Rate limit: 5 per minute
  const rl = await checkRateLimit(session.user.id, "rooms:stream")
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

  // Validate room exists and is owned by host
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (room.status !== RoomStatus.LOBBY && room.status !== RoomStatus.LIVE) {
    return NextResponse.json({ error: "Room is not in a streamable state" }, { status: 400 })
  }

  // Check for already active egress session on this room
  const existingSession = await prisma.streamSession.findFirst({
    where: { roomId: room.id, status: { in: [StreamStatus.STARTING, StreamStatus.LIVE] } },
  })
  if (existingSession) {
    return NextResponse.json({ error: "Stream already active", egressId: existingSession.egressId }, { status: 409 })
  }

  // Parse body
  const body = await req.json().catch(() => ({}))
  const platforms: string[] = body.platforms ?? []
  if (!Array.isArray(platforms) || platforms.length === 0) {
    return NextResponse.json({ error: "At least one platform is required" }, { status: 400 })
  }

  // Validate platform values
  const validPlatforms = new Set(Object.values(PlatformType))
  const requestedPlatforms = platforms
    .map((p) => (typeof p === "string" ? p.toUpperCase() : ""))
    .filter((p) => validPlatforms.has(p as PlatformType)) as PlatformType[]

  if (requestedPlatforms.length === 0) {
    return NextResponse.json({ error: "No valid platforms specified" }, { status: 400 })
  }

  // Get stream keys from PlatformConnection for selected platforms
  const connections = await prisma.platformConnection.findMany({
    where: {
      userId: session.user.id,
      platform: { in: requestedPlatforms },
    },
    select: { platform: true, streamKey: true, ingestUrl: true },
  })

  // Check which platforms are missing stream keys
  const connectionMap = new Map(connections.map((c) => [c.platform, c]))
  const missingKeys: string[] = []
  const destinations: { platform: PlatformType; streamKey: string; ingestUrl?: string | null }[] = []

  for (const platform of requestedPlatforms) {
    const conn = connectionMap.get(platform)
    if (!conn || !conn.streamKey) {
      missingKeys.push(platform)
    } else {
      destinations.push({
        platform,
        streamKey: conn.streamKey,
        ingestUrl: conn.ingestUrl,
      })
    }
  }

  if (missingKeys.length > 0) {
    return NextResponse.json(
      { error: "Missing stream keys for platforms", missingKeys },
      { status: 400 },
    )
  }

  // Create StreamSession record (STARTING)
  const streamSession = await prisma.streamSession.create({
    data: {
      roomId: room.id,
      platforms: requestedPlatforms,
      status: StreamStatus.STARTING,
    },
  })

  try {
    // Start egress via LiveKit
    const { egressId, status } = await startStream(code, destinations)

    // Update StreamSession with egressId and LIVE status
    await prisma.streamSession.update({
      where: { id: streamSession.id },
      data: { egressId, status: StreamStatus.LIVE },
    })

    // Update Room status to LIVE
    await prisma.room.update({
      where: { code },
      data: { status: RoomStatus.LIVE },
    })

    // Publish SSE event
    await publishEvent(code, {
      type: "STREAM_STARTED",
      data: { platforms: requestedPlatforms, egressId },
    })

    return NextResponse.json({
      egressId,
      platforms: requestedPlatforms,
      status: "live",
    })
  } catch (err) {
    // Mark session as FAILED
    const errorMessage = err instanceof Error ? err.message : "Unknown egress error"
    await prisma.streamSession.update({
      where: { id: streamSession.id },
      data: { status: StreamStatus.FAILED, error: errorMessage, endedAt: new Date() },
    })

    // Publish error event
    await publishEvent(code, {
      type: "STREAM_ERROR",
      data: { error: errorMessage },
    })

    console.error("[stream-live] Failed to start egress:", err)
    return NextResponse.json(
      { error: "Failed to start stream", details: errorMessage },
      { status: 502 },
    )
  }
}

// ── DELETE — Stop streaming (End Stream) ───────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Find active StreamSession
  const streamSession = await prisma.streamSession.findFirst({
    where: { roomId: room.id, status: { in: [StreamStatus.STARTING, StreamStatus.LIVE] } },
  })

  if (!streamSession) {
    return NextResponse.json({ error: "No active stream found" }, { status: 404 })
  }

  // Update status to STOPPING
  await prisma.streamSession.update({
    where: { id: streamSession.id },
    data: { status: StreamStatus.STOPPING },
  })

  try {
    if (streamSession.egressId) {
      await stopStream(streamSession.egressId)
    }

    // Mark as ENDED
    await prisma.streamSession.update({
      where: { id: streamSession.id },
      data: { status: StreamStatus.ENDED, endedAt: new Date() },
    })

    // Room goes back to LOBBY (room stays open, just not streaming)
    await prisma.room.update({
      where: { code },
      data: { status: RoomStatus.LOBBY },
    })

    await publishEvent(code, { type: "STREAM_STOPPED" })

    return NextResponse.json({ status: "stopped" })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    await prisma.streamSession.update({
      where: { id: streamSession.id },
      data: { status: StreamStatus.FAILED, error: errorMessage, endedAt: new Date() },
    })

    console.error("[stream-live] Failed to stop egress:", err)
    return NextResponse.json(
      { error: "Failed to stop stream", details: errorMessage },
      { status: 502 },
    )
  }
}

// ── PATCH — Add/remove destination mid-stream ─────────────────────────────

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const action: string = body.action
  const platform: string = body.platform

  if (action !== "add" && action !== "remove") {
    return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 })
  }

  const validPlatforms = new Set(Object.values(PlatformType))
  const dbPlatform = (typeof platform === "string" ? platform.toUpperCase() : "") as PlatformType
  if (!validPlatforms.has(dbPlatform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  // Find active StreamSession
  const streamSession = await prisma.streamSession.findFirst({
    where: { roomId: room.id, status: StreamStatus.LIVE },
  })

  if (!streamSession || !streamSession.egressId) {
    return NextResponse.json({ error: "No active stream found" }, { status: 404 })
  }

  // Get stream key for the platform
  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: dbPlatform } },
    select: { streamKey: true, ingestUrl: true },
  })

  if (!connection || !connection.streamKey) {
    return NextResponse.json({ error: "No stream key found for platform" }, { status: 400 })
  }

  try {
    if (action === "add") {
      await addDestination(
        streamSession.egressId,
        dbPlatform,
        connection.streamKey,
        connection.ingestUrl,
      )

      // Update platforms array (add if not already present)
      const updatedPlatforms = streamSession.platforms.includes(dbPlatform)
        ? streamSession.platforms
        : [...streamSession.platforms, dbPlatform]

      await prisma.streamSession.update({
        where: { id: streamSession.id },
        data: { platforms: updatedPlatforms },
      })
    } else {
      await removeDestination(
        streamSession.egressId,
        dbPlatform,
        connection.streamKey,
        connection.ingestUrl,
      )

      // Update platforms array (remove)
      const updatedPlatforms = streamSession.platforms.filter((p) => p !== dbPlatform)

      await prisma.streamSession.update({
        where: { id: streamSession.id },
        data: { platforms: updatedPlatforms },
      })
    }

    await publishEvent(code, {
      type: "STREAM_DESTINATION_CHANGED",
      data: { action, platform: dbPlatform },
    })

    return NextResponse.json({ ok: true, action, platform: dbPlatform })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error"
    console.error(`[stream-live] Failed to ${action} destination:`, err)

    await publishEvent(code, {
      type: "STREAM_ERROR",
      data: { platform: dbPlatform, error: errorMessage },
    })

    return NextResponse.json(
      { error: `Failed to ${action} destination`, details: errorMessage },
      { status: 502 },
    )
  }
}
