import * as tmi from "tmi.js"
import { publishChat } from "@/lib/redis"
import type { ChatMessage } from "./types"
import { randomUUID } from "crypto"

// Store active clients per room
const activeClients = new Map<string, tmi.Client>()

export async function startTwitchConnector(roomCode: string, channelName: string) {
  // Don't double-connect
  if (activeClients.has(roomCode)) return

  try {
    const client = new tmi.Client({
      channels: [channelName.toLowerCase().replace(/^#/, "")],
      connection: { reconnect: true, secure: true },
    })

    client.on("message", async (_channel, tags, message, self) => {
      if (self) return
      const msg: ChatMessage = {
        id: randomUUID(),
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

    await client.connect()
    activeClients.set(roomCode, client)
  } catch (err) {
    console.error(`[Twitch] Failed to connect for room ${roomCode}:`, err)
  }
}

export async function stopTwitchConnector(roomCode: string) {
  const client = activeClients.get(roomCode)
  if (!client) return
  try { await client.disconnect() } catch {}
  activeClients.delete(roomCode)
}
