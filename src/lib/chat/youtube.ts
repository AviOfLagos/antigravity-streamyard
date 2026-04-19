import { publishChat, publishEvent } from "@/lib/redis"
import type { ChatMessage } from "./types"
import type { RoomEvent } from "@/lib/redis"
import { randomUUID } from "crypto"

interface YouTubeConnectorState {
  liveChatId: string | null
  accessToken: string
  intervalId: ReturnType<typeof setInterval> | null
  pageToken: string | undefined
  /** Callback to refresh the token; set by the manager if a connectionRow is available */
  onTokenRefresh?: () => Promise<string | null>
  /** Consecutive error count for backoff */
  consecutiveErrors: number
}

const activeConnectors = new Map<string, YouTubeConnectorState>()

function publishConnectorStatus(roomCode: string, status: string, error?: string) {
  publishEvent(roomCode, {
    type: "CHAT_CONNECTOR_STATUS",
    data: { platform: "youtube", status, ...(error ? { error } : {}) },
  } as unknown as RoomEvent).catch(() => {})
}

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

    let res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${state.accessToken}` },
    })

    // If 401, attempt token refresh and retry once
    if (res.status === 401 && state.onTokenRefresh) {
      console.warn(`[YouTube] 401 for room ${roomCode}, attempting token refresh...`)
      const newToken = await state.onTokenRefresh()
      if (newToken) {
        state.accessToken = newToken
        res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${state.accessToken}` },
        })
      }
    }

    if (!res.ok) {
      state.consecutiveErrors++
      const errMsg = `API returned ${res.status}`

      if (res.status === 401) {
        // Token expired and refresh failed
        publishConnectorStatus(roomCode, "failed", "Authentication failed")
        console.error(`[YouTube] Auth failed permanently for room ${roomCode}`)
        return
      }

      if (res.status === 403) {
        // Quota exceeded — back off significantly
        publishConnectorStatus(roomCode, "reconnecting", "Quota exceeded, backing off")
        console.warn(`[YouTube] Quota exceeded for room ${roomCode}, will retry`)
        return
      }

      if (res.status >= 500) {
        // Server error — report and back off
        publishConnectorStatus(roomCode, "reconnecting", errMsg)
        console.error(`[YouTube] Server error ${res.status} for room ${roomCode}`)
        return
      }

      console.error(`[YouTube] ${errMsg} for room ${roomCode}`)
      return
    }

    // Reset error count on success
    state.consecutiveErrors = 0

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
    state.consecutiveErrors++
    console.error(`[YouTube] Poll error for room ${roomCode}:`, err)
    if (state.consecutiveErrors >= 3) {
      publishConnectorStatus(roomCode, "reconnecting", "Multiple consecutive errors")
    }
  }
}

export async function startYouTubeConnector(
  roomCode: string,
  accessToken: string,
  onTokenRefresh?: () => Promise<string | null>,
) {
  if (activeConnectors.has(roomCode)) return

  const state: YouTubeConnectorState = {
    liveChatId: null,
    accessToken,
    intervalId: null,
    pageToken: undefined,
    onTokenRefresh,
    consecutiveErrors: 0,
  }

  publishConnectorStatus(roomCode, "connecting")

  // Poll every 20 seconds (quota-conscious)
  state.intervalId = setInterval(() => pollMessages(roomCode, state), 20_000)
  activeConnectors.set(roomCode, state)

  // Initial poll after 5 seconds
  setTimeout(() => {
    pollMessages(roomCode, state).then(() => {
      if (state.consecutiveErrors === 0) {
        publishConnectorStatus(roomCode, "connected")
      }
    })
  }, 5_000)
}

export function stopYouTubeConnector(roomCode: string) {
  const state = activeConnectors.get(roomCode)
  if (!state) return
  if (state.intervalId) clearInterval(state.intervalId)
  activeConnectors.delete(roomCode)
}
