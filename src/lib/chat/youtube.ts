import { publishChat } from "@/lib/redis"
import type { ChatMessage } from "./types"
import { randomUUID } from "crypto"

interface YouTubeConnectorState {
  liveChatId: string | null
  accessToken: string
  intervalId: ReturnType<typeof setInterval> | null
  pageToken: string | undefined
}

const activeConnectors = new Map<string, YouTubeConnectorState>()

async function fetchActiveLiveChatId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&broadcastStatus=active&broadcastType=all",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    const data = await res.json()
    return data.items?.[0]?.snippet?.liveChatId ?? null
  } catch {
    return null
  }
}

async function pollMessages(roomCode: string, state: YouTubeConnectorState) {
  if (!state.liveChatId) {
    // Try to get liveChatId
    state.liveChatId = await fetchActiveLiveChatId(state.accessToken)
    if (!state.liveChatId) return
  }

  try {
    const url = new URL("https://www.googleapis.com/youtube/v3/liveChat/messages")
    url.searchParams.set("liveChatId", state.liveChatId)
    url.searchParams.set("part", "snippet,authorDetails")
    if (state.pageToken) url.searchParams.set("pageToken", state.pageToken)

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${state.accessToken}` },
    })
    const data = await res.json()

    if (data.nextPageToken) state.pageToken = data.nextPageToken

    for (const item of data.items ?? []) {
      const msg: ChatMessage = {
        id: item.id ?? randomUUID(),
        platform: "youtube",
        author: {
          name: item.authorDetails?.displayName ?? "Unknown",
          avatar: item.authorDetails?.profileImageUrl,
        },
        message: item.snippet?.displayMessage ?? "",
        timestamp: item.snippet?.publishedAt ?? new Date().toISOString(),
      }
      await publishChat(roomCode, msg).catch(console.error)
    }
  } catch (err) {
    console.error(`[YouTube] Poll error for room ${roomCode}:`, err)
  }
}

export async function startYouTubeConnector(roomCode: string, accessToken: string) {
  if (activeConnectors.has(roomCode)) return

  const state: YouTubeConnectorState = {
    liveChatId: null,
    accessToken,
    intervalId: null,
    pageToken: undefined,
  }

  // Poll every 20 seconds (quota-conscious)
  state.intervalId = setInterval(() => pollMessages(roomCode, state), 20_000)
  activeConnectors.set(roomCode, state)

  // Initial poll after 5 seconds
  setTimeout(() => pollMessages(roomCode, state), 5_000)
}

export function stopYouTubeConnector(roomCode: string) {
  const state = activeConnectors.get(roomCode)
  if (!state) return
  if (state.intervalId) clearInterval(state.intervalId)
  activeConnectors.delete(roomCode)
}
