import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getTokenHealth, type PlatformConnectionRow } from "@/lib/auth/token-refresh"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ platforms: [] })
  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({
    platforms: connections.map((c) => ({
      platform: c.platform.toLowerCase(),
      channelName: c.channelName,
      tokenHealth: getTokenHealth(c as PlatformConnectionRow),
      expiresAt: c.expiresAt?.toISOString() ?? null,
    })),
  })
}
