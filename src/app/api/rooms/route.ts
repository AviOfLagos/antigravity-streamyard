import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createLivekitRoom, generateHostToken } from "@/lib/livekit"
import { setRoomInfo } from "@/lib/redis"
import { generateRoomCode } from "@/lib/utils/roomCode"
import { NextResponse } from "next/server"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const code = generateRoomCode()

  try {
    // Create LiveKit room
    await createLivekitRoom(code)

    // Persist room in DB
    await prisma.room.create({
      data: { code, hostId: session.user.id, status: "active" },
    })

    // Store in Redis
    await setRoomInfo(code, { hostId: session.user.id, createdAt: Date.now() })

    // Generate host token
    const hostToken = generateHostToken(code, session.user.id, session.user.name ?? "Host")

    return NextResponse.json({ code, hostToken })
  } catch (err) {
    console.error("Failed to create room:", err)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
