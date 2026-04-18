import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform, channelName, channelId } = await req.json()
  if (!platform || !channelName) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  await prisma.platformConnection.upsert({
    where: { userId_platform: { userId: session.user.id, platform } },
    create: { userId: session.user.id, platform, channelName, channelId },
    update: { channelName, channelId },
  })

  return NextResponse.json({ ok: true })
}
