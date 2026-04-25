// TikTok chat connector — BEST EFFORT ONLY
// Uses unofficial tiktok-live-connector which may be blocked by TikTok
// If it fails, we log and move on — studio remains fully functional without TikTok chat

import { publishChat, publishEvent } from "@/lib/redis"
import type { ChatMessage } from "./types"
import type { RoomEvent } from "@/lib/redis"
import { randomUUID } from "crypto"

const DIAMOND_USD_VALUE = 0.005 // 1 diamond ≈ $0.005

const activeConnectors = new Map<string, unknown>()

function publishConnectorStatus(roomCode: string, status: string, error?: string) {
  publishEvent(roomCode, {
    type: "CHAT_CONNECTOR_STATUS",
    data: { platform: "tiktok", status, ...(error ? { error } : {}) },
  } as unknown as RoomEvent).catch(() => {})
}

export async function startTikTokConnector(roomCode: string, username: string) {
  if (activeConnectors.has(roomCode)) return

  const { WebcastPushConnection } = await import("tiktok-live-connector")

  const cleanUsername = username.replace(/^@/, "")
  const connection = new WebcastPushConnection(cleanUsername, {
    requestPollingIntervalMs: 2000,
    sessionId: undefined,
    enableExtendedGiftInfo: true,
  })

  // Chat messages
  connection.on("chat", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
    comment?: string
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: data.comment ?? "",
      timestamp: new Date().toISOString(),
      eventType: "text",
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Gift events (donations)
  connection.on("gift", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
    giftName?: string
    diamondCount?: number
    repeatCount?: number
    repeatEnd?: boolean
    giftId?: number
    describe?: string
  }) => {
    // Only publish on streak end or single gifts to avoid spam
    if (data.repeatEnd === false) return

    const diamonds = (data.diamondCount ?? 0) * (data.repeatCount ?? 1)
    const usdValue = diamonds * DIAMOND_USD_VALUE

    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: `Sent ${data.giftName ?? "a gift"} x${data.repeatCount ?? 1}`,
      timestamp: new Date().toISOString(),
      eventType: "donation",
      donation: {
        amount: diamonds,
        currency: "diamonds",
        formattedAmount: usdValue >= 1
          ? `${data.giftName ?? "Gift"} ($${usdValue.toFixed(2)})`
          : `${data.giftName ?? "Gift"} (${diamonds} diamonds)`,
      },
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Like events
  connection.on("like", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
    likeCount?: number
    totalLikeCount?: number
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: `Liked the stream`,
      timestamp: new Date().toISOString(),
      eventType: "like",
      likeCount: data.likeCount ?? 1,
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Follow events
  connection.on("follow", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: `${data.nickname ?? data.uniqueId ?? "Someone"} followed!`,
      timestamp: new Date().toISOString(),
      eventType: "follow",
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Member join events
  connection.on("member", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: `joined the stream`,
      timestamp: new Date().toISOString(),
      eventType: "join",
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Subscribe events
  connection.on("subscribe", async (data: {
    uniqueId?: string
    nickname?: string
    profilePictureUrl?: string
  }) => {
    const msg: ChatMessage = {
      id: randomUUID(),
      platform: "tiktok",
      author: {
        name: data.nickname ?? data.uniqueId ?? "TikTok User",
        avatar: data.profilePictureUrl,
      },
      message: `${data.nickname ?? data.uniqueId ?? "Someone"} subscribed!`,
      timestamp: new Date().toISOString(),
      eventType: "subscription",
      subscription: { isGift: false },
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // Connection events
  connection.on("connected", () => {
    publishConnectorStatus(roomCode, "connected")
  })

  connection.on("disconnected", () => {
    console.warn(`[TikTok] Disconnected for room ${roomCode}`)
    publishConnectorStatus(roomCode, "reconnecting", "TikTok connection lost")
  })

  connection.on("error", (err: Error) => {
    console.warn(`[TikTok] Connection error (expected on prod IPs):`, err.message)
    publishConnectorStatus(roomCode, "reconnecting", err.message)
  })

  publishConnectorStatus(roomCode, "connecting")
  await connection.connect()
  activeConnectors.set(roomCode, connection)
}

export async function stopTikTokConnector(roomCode: string) {
  const conn = activeConnectors.get(roomCode) as { disconnect?: () => void } | undefined
  if (!conn) return
  try { conn.disconnect?.() } catch {}
  activeConnectors.delete(roomCode)
}
