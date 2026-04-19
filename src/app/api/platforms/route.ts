import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ platforms: [] })
  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
    select: { platform: true, channelName: true },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({
    platforms: connections.map((c) => ({ ...c, platform: c.platform.toLowerCase() })),
  })
}
