import { PlatformType } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { PlatformConnectRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

// Map lowercase platform names to Prisma PlatformType enum
const toPrismaPlat = (p: string): PlatformType =>
  PlatformType[p.toUpperCase() as keyof typeof PlatformType]

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit: 5 requests per minute per user
  const rl = await checkRateLimit(session.user.id, "platforms:connect")
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

  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(PlatformConnectRequestSchema, body)
  if (!validation.success) return validation.response

  const { platform, channelName, channelId } = validation.data
  const dbPlatform = toPrismaPlat(platform)
  const resolvedChannelId = channelId ?? channelName

  await prisma.platformConnection.upsert({
    where: { userId_platform: { userId: session.user.id, platform: dbPlatform } },
    create: { userId: session.user.id, platform: dbPlatform, channelName, channelId: resolvedChannelId },
    update: { channelName, channelId: resolvedChannelId },
  })

  return NextResponse.json({ ok: true })
}
