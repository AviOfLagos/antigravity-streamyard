import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { startConnectors } from "@/lib/chat/manager"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params

  // Get host's platform connections
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

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

  const platformData = platforms.map((p) => ({
    platform: p.platform,
    channelName: p.channelName,
    accessToken: p.platform === "youtube" ? youtubeAccessToken : null,
  }))

  // Start connectors asynchronously — don't await
  startConnectors(code, platformData).catch(console.error)

  return NextResponse.json({ ok: true, platforms: platforms.map((p) => p.platform) })
}
