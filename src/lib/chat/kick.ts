import Pusher from "pusher-js"
import { publishChat } from "@/lib/redis"
import type { ChatMessage } from "./types"
import { randomUUID } from "crypto"

const activeConnectors = new Map<string, { pusher: Pusher; channelName: string }>()

export async function startKickConnector(roomCode: string, channelName: string) {
  if (activeConnectors.has(roomCode)) return

  try {
    // Kick uses Pusher for real-time chat (public app key)
    const pusher = new Pusher("32cbd69e4b950bf97679", {
      cluster: "us2",
      forceTLS: true,
    })

    // Need channel ID from Kick API — use channelName to fetch it
    const channelRes = await fetch(`https://kick.com/api/v2/channels/${channelName}`)
    if (!channelRes.ok) throw new Error(`Kick channel not found: ${channelName}`)
    const channelData = await channelRes.json()
    const channelId = channelData.id

    const channel = pusher.subscribe(`channel.${channelId}`)
    channel.bind("App\\Events\\ChatMessageEvent", async (data: {
      id?: string
      sender?: { username?: string; slug?: string }
      content?: string
      created_at?: string
    }) => {
      const msg: ChatMessage = {
        id: data.id?.toString() ?? randomUUID(),
        platform: "kick",
        author: {
          name: data.sender?.username ?? data.sender?.slug ?? "Unknown",
        },
        message: data.content ?? "",
        timestamp: data.created_at ?? new Date().toISOString(),
      }
      await publishChat(roomCode, msg).catch(console.error)
    })

    activeConnectors.set(roomCode, { pusher, channelName })
  } catch (err) {
    console.error(`[Kick] Failed to connect for room ${roomCode}:`, err)
  }
}

export function stopKickConnector(roomCode: string) {
  const state = activeConnectors.get(roomCode)
  if (!state) return
  try { state.pusher.disconnect() } catch {}
  activeConnectors.delete(roomCode)
}
