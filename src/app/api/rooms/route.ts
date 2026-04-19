import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { createLivekitRoom, generateHostToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { redis, setRoomInfo } from "@/lib/redis"
import { generateRoomCode } from "@/lib/utils/roomCode"

const MAX_CODE_RETRIES = 5

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    // Create LiveKit room first (code is only used for room name, collision is DB-side)
    let code = generateRoomCode()
    await createLivekitRoom(code)

    // Persist room in DB — retry on unique constraint collision (P2002)
    let attempt = 0
    while (true) {
      try {
        await prisma.room.create({
          data: { code, hostId: session.user.id, status: "active" },
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
    await setRoomInfo(code, { hostId: session.user.id, createdAt: now })

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
