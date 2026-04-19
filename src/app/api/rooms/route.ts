import { PlatformType, RoomStatus } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { createLivekitRoom, generateHostToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { checkRateLimit } from "@/lib/rate-limit"
import { redis, setRoomInfo } from "@/lib/redis"
import { CreateRoomRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"
import { generateRoomCode } from "@/lib/utils/roomCode"

const VALID_PLATFORMS = new Set<string>(Object.values(PlatformType))

const MAX_CODE_RETRIES = 5

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit: 5 requests per minute per user
  const rl = await checkRateLimit(session.user.id, "rooms:create")
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
  const validation = validateRequestBody(CreateRoomRequestSchema, body)
  if (!validation.success) return validation.response

  const title = validation.data.title?.trim() || null
  const rawPlatforms = validation.data.selectedPlatforms ?? []
  // Validate and cast platform strings to PlatformType enum values (uppercase)
  const selectedPlatforms: PlatformType[] = rawPlatforms
    .map((p: string) => (typeof p === "string" ? p.toUpperCase() : ""))
    .filter((p: string) => VALID_PLATFORMS.has(p)) as PlatformType[]

  try {
    // Create LiveKit room first (code is only used for room name, collision is DB-side)
    let code = generateRoomCode()
    await createLivekitRoom(code)

    // Persist room in DB — retry on unique constraint collision (P2002)
    let attempt = 0
    while (true) {
      try {
        await prisma.room.create({
          data: { code, hostId: session.user.id, status: RoomStatus.LOBBY, title, selectedPlatforms },
        })
        break
      } catch (err: unknown) {
        const isPrismaError =
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code: string }).code === "P2002"

        if (isPrismaError && attempt < MAX_CODE_RETRIES - 1) {
          attempt++
          code = generateRoomCode()
          continue
        }
        throw err
      }
    }

    const now = Date.now()

    // Store in Redis
    await setRoomInfo(code, { hostId: session.user.id, createdAt: now, title })

    // Store session start timestamp for duration calculation
    await redis.set(`session:start:${code}`, now, { ex: 60 * 60 * 24 * 2 })

    // Generate host token
    const hostToken = await generateHostToken(code, session.user.id, session.user.name ?? "Host")

    return NextResponse.json({ code, hostToken })
  } catch (err) {
    console.error("Failed to create room:", err)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
