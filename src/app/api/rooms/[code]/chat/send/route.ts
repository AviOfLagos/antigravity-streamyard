import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { getCachedRoom } from "@/lib/room-cache"
import { sendYouTubeMessage } from "@/lib/chat/youtube"
import { sendTwitchMessage } from "@/lib/chat/twitch"
import { publishChat } from "@/lib/redis"

const SendMessageSchema = z.object({
  message: z.string().min(1).max(500),
  platforms: z.array(z.enum(["youtube", "twitch", "kick", "tiktok"])).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { code } = await params
  const body = await req.json().catch(() => ({}))
  const parsed = SendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 })
  }

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { message, platforms } = parsed.data
  const targetPlatforms = platforms ?? ["youtube", "twitch"]

  const results: Record<string, boolean> = {}

  // Send to each platform in parallel
  const sends = targetPlatforms.map(async (platform) => {
    try {
      switch (platform) {
        case "youtube":
          results.youtube = await sendYouTubeMessage(code, message)
          break
        case "twitch":
          results.twitch = await sendTwitchMessage(code, message)
          break
        case "kick":
          // Kick requires OAuth 2.1 — not yet implemented
          results.kick = false
          break
        case "tiktok":
          // TikTok requires session cookies — not yet implemented
          results.tiktok = false
          break
      }
    } catch {
      results[platform] = false
    }
  })

  await Promise.allSettled(sends)

  // Publish host message to the room's chat Redis list so guests can see it via SSE
  const hostChatMessage = {
    id: crypto.randomUUID(),
    platform: "host" as const,
    author: { name: "Host" },
    message,
    timestamp: new Date().toISOString(),
    eventType: "text" as const,
  }
  await publishChat(code, hostChatMessage).catch(() => {
    // Non-critical — guests may not see the message but host will
  })

  return NextResponse.json({ ok: true, results, hostMessageId: hostChatMessage.id })
}
