import { PlatformType, RoomStatus } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { startConnectors } from "@/lib/chat/manager"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { RoomCodeSchema } from "@/lib/schemas"
import type { PlatformConnectionRow } from "@/lib/auth/token-refresh"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  // Validate room code format
  const codeResult = RoomCodeSchema.safeParse(code)
  if (!codeResult.success) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  // Rate limit: 2 requests per minute per user
  const rl = await checkRateLimit(session.user.id, "rooms:chat-connect")
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

  // Get host's platform connections
  const room = await prisma.room.findUnique({
    where: { code },
    select: { hostId: true, status: true, selectedPlatforms: true },
  })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // G33: reject if the room has already ended
  if (room.status === RoomStatus.ENDED) {
    return NextResponse.json({ error: "Room has ended" }, { status: 410 })
  }

  const selectedPlatforms: PlatformType[] = room.selectedPlatforms ?? []

  const platforms = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
  })

  // Only include platforms the host selected for this broadcast.
  // If selectedPlatforms is empty (legacy rooms), connect all as before.
  const filteredConnections = platforms.filter((c) =>
    selectedPlatforms.length === 0 || selectedPlatforms.includes(c.platform)
  )

  const platformData = filteredConnections.map((p) => ({
    platform: p.platform,
    channelName: p.channelName,
    accessToken: p.accessToken,
    // Pass the full connection row so the manager can handle token refresh
    connectionRow: p as PlatformConnectionRow,
  }))

  // Start connectors asynchronously — don't await
  startConnectors(code, platformData).catch(console.error)

  return NextResponse.json({
    ok: true,
    platforms: filteredConnections.map((p) => p.platform.toLowerCase()),
  })
}
