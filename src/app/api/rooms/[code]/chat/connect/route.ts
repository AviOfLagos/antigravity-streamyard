import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { startConnectors } from "@/lib/chat/manager"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  // Get host's platform connections
  const room = await prisma.room.findUnique({
    where: { code },
    select: { hostId: true, status: true, selectedPlatforms: true },
  })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // G33: reject if the room has already ended
  if (room.status === "ended") {
    return NextResponse.json({ error: "Room has ended" }, { status: 410 })
  }

  const selectedPlatforms: string[] = room.selectedPlatforms ?? []

  const platforms = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
  })

  // Get YouTube access token from account if connected
  const youtubeConn = platforms.find((p) => p.platform === "youtube")
  let youtubeAccessToken: string | null = null
  if (youtubeConn) {
    const account = await prisma.account.findFirst({
      where: { userId: session.user.id, provider: "google" },
      select: { access_token: true },
    })
    youtubeAccessToken = account?.access_token ?? null
  }

  // Only include platforms the host selected for this broadcast.
  // If selectedPlatforms is empty (legacy rooms), connect all as before.
  const filteredConnections = platforms.filter((c) =>
    selectedPlatforms.length === 0 || selectedPlatforms.includes(c.platform)
  )

  const platformData = filteredConnections.map((p) => ({
    platform: p.platform,
    channelName: p.channelName,
    accessToken: p.platform === "youtube" ? youtubeAccessToken : null,
  }))

  // Start connectors asynchronously — don't await
  startConnectors(code, platformData).catch(console.error)

  return NextResponse.json({ ok: true, platforms: filteredConnections.map((p) => p.platform) })
}
