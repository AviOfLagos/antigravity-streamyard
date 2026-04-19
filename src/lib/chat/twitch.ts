import * as tmi from "tmi.js"
import { publishChat, publishEvent } from "@/lib/redis"
import type { ChatMessage } from "./types"
import type { RoomEvent } from "@/lib/redis"
import { randomUUID } from "crypto"

// Store active clients per room
const activeClients = new Map<string, tmi.Client>()

function publishConnectorStatus(roomCode: string, status: string, error?: string) {
  publishEvent(roomCode, {
    type: "CHAT_CONNECTOR_STATUS",
    data: { platform: "twitch", status, ...(error ? { error } : {}) },
  } as unknown as RoomEvent).catch(() => {})
}

export async function startTwitchConnector(roomCode: string, channelName: string) {
  // Don't double-connect
  if (activeClients.has(roomCode)) return

  const client = new tmi.Client({
    channels: [channelName.toLowerCase().replace(/^#/, "")],
    connection: { reconnect: true, secure: true },
  })

  client.on("message", async (_channel, tags, message, self) => {
    if (self) return
    const msg: ChatMessage = {
      id: tags.id ?? randomUUID(),
      platform: "twitch",
      author: {
        name: tags["display-name"] ?? tags.username ?? "Unknown",
        color: tags.color ?? undefined,
        badges: tags.badges ? Object.keys(tags.badges) : undefined,
      },
      message,
      timestamp: new Date().toISOString(),
    }
    await publishChat(roomCode, msg).catch(console.error)
  })

  // tmi.js built-in reconnection — hook into events for status reporting
  client.on("connected", () => {
    publishConnectorStatus(roomCode, "connected")
  })

  client.on("disconnected", (reason: string) => {
    console.warn(`[Twitch] Disconnected for room ${roomCode}:`, reason)
    publishConnectorStatus(roomCode, "reconnecting", reason)
  })

  client.on("reconnect", () => {
    console.info(`[Twitch] Reconnecting for room ${roomCode}`)
    publishConnectorStatus(roomCode, "reconnecting")
  })

  await client.connect()
  activeClients.set(roomCode, client)
}

export async function stopTwitchConnector(roomCode: string) {
  const client = activeClients.get(roomCode)
  if (!client) return
  try { await client.disconnect() } catch {}
  activeClients.delete(roomCode)
}
