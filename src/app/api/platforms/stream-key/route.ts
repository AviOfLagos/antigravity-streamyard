import { PlatformType } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { StreamKeyRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

const toPrismaPlat = (p: string): PlatformType =>
  PlatformType[p.toUpperCase() as keyof typeof PlatformType]

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rl = await checkRateLimit(session.user.id, "platforms:stream-key")
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
  const validation = validateRequestBody(StreamKeyRequestSchema, body)
  if (!validation.success) return validation.response

  const { platform, streamKey, ingestUrl } = validation.data
  const dbPlatform = toPrismaPlat(platform)

  // Ensure the platform connection exists
  const connection = await prisma.platformConnection.findUnique({
    where: { userId_platform: { userId: session.user.id, platform: dbPlatform } },
  })

  if (!connection) {
    return NextResponse.json({ error: "Platform not connected" }, { status: 404 })
  }

  await prisma.platformConnection.update({
    where: { userId_platform: { userId: session.user.id, platform: dbPlatform } },
    data: { streamKey, ingestUrl: ingestUrl ?? null },
  })

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/platforms/stream-key
 * Returns stream key status for all connected platforms (has key or not — never the key itself).
 */
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
    select: { platform: true, streamKey: true },
  })

  const platforms = connections.map((c) => ({
    platform: c.platform,
    hasStreamKey: !!c.streamKey,
  }))

  return NextResponse.json({ platforms })
}
