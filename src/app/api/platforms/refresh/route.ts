import { PlatformType } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { refreshIfNeeded, getTokenHealth, type PlatformConnectionRow } from "@/lib/auth/token-refresh"
import { PlatformSchema } from "@/lib/schemas/platform"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = PlatformSchema.safeParse(body?.platform)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 })
  }

  const platform = parsed.data.toUpperCase() as keyof typeof PlatformType
  const dbPlatform = PlatformType[platform]

  // Kick and TikTok don't use OAuth — no token to refresh
  if (dbPlatform === PlatformType.KICK || dbPlatform === PlatformType.TIKTOK) {
    return NextResponse.json({
      ok: true,
      status: "no_token",
      message: "This platform does not require token management",
    })
  }

  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: dbPlatform } },
  })

  if (!connection) {
    return NextResponse.json({ error: "Platform not connected" }, { status: 404 })
  }

  const updated = await refreshIfNeeded(connection as PlatformConnectionRow)
  const health = getTokenHealth(updated)

  return NextResponse.json({
    ok: true,
    status: health,
    expiresAt: updated.expiresAt?.toISOString() ?? null,
    channelName: updated.channelName,
  })
}
