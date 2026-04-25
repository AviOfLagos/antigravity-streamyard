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

  const pusher = new Pusher("32cbd69e4b950bf97679", {
    cluster: "us2",
    forceTLS: true,
  })

  // Connection state changes
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

  // Fetch channel ID from Kick API
  const channelRes = await fetch(`https://kick.com/api/v2/channels/${channelName}`)
  if (!channelRes.ok) throw new Error(`Kick channel not found: ${channelName}`)
  const channelData = await channelRes.json()
  const channelId = channelData.id
  const chatroomId = channelData.chatroom?.id ?? channelId

  // Subscribe to chatroom (v2 format)
  const channel = pusher.subscribe(`chatrooms.${chatroomId}.v2`)

  // Chat messages
  channel.bind("App\\Events\\ChatMessageSentEvent", async (data: {
    id?: string
    sender?: { username?: string; slug?: string; identity?: { badges?: Array<{ type?: string }> } }
    content?: string
    created_at?: string
    type?: string
  }) => {
    const badges: string[] = []
    if (data.sender?.identity?.badges) {
      for (const badge of data.sender.identity.badges) {
        if (badge.type) badges.push(badge.type)
      }
    }

    const msg: ChatMessage = {
      id: data.id?.toString() ?? randomUUID(),
      platform: "kick",
      author: {
        name: data.sender?.username ?? data.sender?.slug ?? "Unknown",
        badges: badges.length > 0 ? badges : undefined,
      },
      message: data.content ?? "",
      timestamp: data.created_at ?? new Date().toISOString(),
      eventType: "text",
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Subscription events
  channel.bind("App\\Events\\SubscriptionEvent", async (data: {
    username?: string
    months?: number
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "kick",
      author: { name: data.username ?? "Unknown" },
      message: `${data.username ?? "Someone"} subscribed!`,
      timestamp: new Date().toISOString(),
      eventType: "subscription",
      subscription: {
        months: data.months,
        isGift: false,
      },
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Gifted subscription events
  channel.bind("App\\Events\\GiftedSubscriptionsEvent", async (data: {
    gifter_username?: string
    gifted_usernames?: string[]
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "kick",
      author: { name: data.gifter_username ?? "Unknown" },
      message: `${data.gifter_username ?? "Someone"} gifted ${data.gifted_usernames?.length ?? 1} sub(s)!`,
      timestamp: new Date().toISOString(),
      eventType: "subscription",
      subscription: {
        isGift: true,
        gifterName: data.gifter_username,
        giftCount: data.gifted_usernames?.length ?? 1,
      },
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Also subscribe to channel-level events
  const channelEvents = pusher.subscribe(`channel.${channelId}`)

  // Follow events
  channelEvents.bind("App\\Events\\FollowersUpdated", async (data: {
    username?: string
    followersCount?: number
  }) => {
    if (!data.username) return
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "kick",
      author: { name: data.username },
      message: `${data.username} followed!`,
      timestamp: new Date().toISOString(),
      eventType: "follow",
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
