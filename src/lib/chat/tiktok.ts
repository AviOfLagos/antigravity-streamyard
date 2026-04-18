// TikTok chat connector — BEST EFFORT ONLY
// Uses unofficial tiktok-live-connector which may be blocked by TikTok
// If it fails, we log and move on — studio remains fully functional without TikTok chat

import { publishChat } from "@/lib/redis"
import type { ChatMessage } from "./types"
import { randomUUID } from "crypto"

const activeConnectors = new Map<string, unknown>()

export async function startTikTokConnector(roomCode: string, username: string) {
  if (activeConnectors.has(roomCode)) return

  try {
    // Dynamic import to avoid crashing if the module has issues
    const { WebcastPushConnection } = await import("tiktok-live-connector")

    const cleanUsername = username.replace(/^@/, "")
    const connection = new WebcastPushConnection(cleanUsername, {
      requestPollingIntervalMs: 2000,
      sessionId: undefined,
    })

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
      }
      await publishChat(roomCode, msg).catch(console.error)
    })

    connection.on("error", (err: Error) => {
      console.warn(`[TikTok] Connection error (expected on prod IPs):`, err.message)
    })

    await connection.connect()
    activeConnectors.set(roomCode, connection)
  } catch (err) {
    // Non-blocking — TikTok is best-effort
    console.warn(`[TikTok] Could not connect for room ${roomCode} (expected):`, err)
  }
}

export async function stopTikTokConnector(roomCode: string) {
  const conn = activeConnectors.get(roomCode) as { disconnect?: () => void } | undefined
  if (!conn) return
  try { conn.disconnect?.() } catch {}
  activeConnectors.delete(roomCode)
}
