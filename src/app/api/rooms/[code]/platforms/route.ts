import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ platforms: [] })
  const { code } = await params
  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) return NextResponse.json({ platforms: [] })
  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
    select: { platform: true, channelName: true },
  })
  return NextResponse.json({
    platforms: connections.map((c) => ({ ...c, platform: c.platform.toLowerCase() })),
  })
}
