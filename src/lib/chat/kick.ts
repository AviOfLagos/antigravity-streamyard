import Pusher from "pusher-js"
import { publishChat, publishEvent } from "@/lib/redis"
import type { ChatMessage } from "./types"
import type { RoomEvent } from "@/lib/redis"
import { randomUUID } from "crypto"

const activeConnectors = new Map<string, { pusher: Pusher; channelName: string }>()

function publishConnectorStatus(roomCode: string, status: string, error?: string) {
  publishEvent(roomCode, {
    type: "CHAT_CONNECTOR_STATUS",
    data: { platform: "kick", status, ...(error ? { error } : {}) },
  } as unknown as RoomEvent).catch(() => {})
}

export async function startKickConnector(roomCode: string, channelName: string) {
  if (activeConnectors.has(roomCode)) return

  // Kick uses Pusher for real-time chat (public app key)
  const pusher = new Pusher("32cbd69e4b950bf97679", {
    cluster: "us2",
    forceTLS: true,
  })

  // Hook into Pusher connection state changes for status reporting
  pusher.connection.bind("connecting", () => {
    publishConnectorStatus(roomCode, "connecting")
  })

  pusher.connection.bind("connected", () => {
    publishConnectorStatus(roomCode, "connected")
  })

  pusher.connection.bind("disconnected", () => {
    publishConnectorStatus(roomCode, "reconnecting", "Pusher disconnected")
  })

  pusher.connection.bind("failed", () => {
    publishConnectorStatus(roomCode, "failed", "Pusher connection failed")
  })

  pusher.connection.bind("unavailable", () => {
    publishConnectorStatus(roomCode, "reconnecting", "Pusher unavailable")
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
}

export function stopKickConnector(roomCode: string) {
  const state = activeConnectors.get(roomCode)
  if (!state) return
  try { state.pusher.disconnect() } catch {}
  activeConnectors.delete(roomCode)
}
