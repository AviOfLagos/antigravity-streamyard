import { publishChat, publishEvent } from "@/lib/redis"
import type { ChatMessage } from "./types"
import type { RoomEvent } from "@/lib/redis"
import { randomUUID } from "crypto"

interface YouTubeConnectorState {
  liveChatId: string | null
  accessToken: string
  intervalId: ReturnType<typeof setTimeout> | null
  pageToken: string | undefined
  pollingIntervalMs: number
  onTokenRefresh?: () => Promise<string | null>
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

function resolveEventType(snippet: Record<string, unknown>): ChatMessage["eventType"] {
  const type = snippet.type as string | undefined
  if (type === "superChatEvent" || type === "superStickerEvent") return "donation"
  if (type === "membershipGiftingEvent" || type === "giftMembershipReceivedEvent") return "subscription"
  return "text"
}

function extractDonation(snippet: Record<string, unknown>): ChatMessage["donation"] | undefined {
  const details = snippet.superChatDetails as Record<string, unknown> | undefined
  if (details) {
    return {
      amount: Number(details.amountMicros ?? 0) / 1_000_000,
      currency: String(details.currency ?? "USD"),
      formattedAmount: String(details.amountDisplayString ?? "$0.00"),
      tier: Number(details.tier ?? 1),
    }
  }
  const stickerDetails = snippet.superStickerDetails as Record<string, unknown> | undefined
  if (stickerDetails) {
    return {
      amount: Number(stickerDetails.amountMicros ?? 0) / 1_000_000,
      currency: String(stickerDetails.currency ?? "USD"),
      formattedAmount: String(stickerDetails.amountDisplayString ?? "$0.00"),
    }
  }
  return undefined
}

function extractSubscription(snippet: Record<string, unknown>): ChatMessage["subscription"] | undefined {
  const giftDetails = snippet.membershipGiftingDetails as Record<string, unknown> | undefined
  if (giftDetails) {
    return {
      isGift: true,
      giftCount: Number(giftDetails.giftMembershipsCount ?? 1),
      tier: String(giftDetails.giftMembershipsLevelName ?? "Member"),
    }
  }
  return undefined
}

async function pollMessages(roomCode: string, state: YouTubeConnectorState) {
  if (!state.liveChatId) {
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

    // Token refresh on 401
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
        publishConnectorStatus(roomCode, "failed", "Authentication failed")
        return
      }
      if (res.status === 403) {
        publishConnectorStatus(roomCode, "reconnecting", "Quota exceeded, backing off")
        return
      }
      if (res.status >= 500) {
        publishConnectorStatus(roomCode, "reconnecting", errMsg)
        return
      }
      console.error(`[YouTube] ${errMsg} for room ${roomCode}`)
      return
    }

    state.consecutiveErrors = 0
    const data = await res.json()

    if (data.nextPageToken) state.pageToken = data.nextPageToken
    // Use dynamic polling interval from API response
    if (data.pollingIntervalMillis && typeof data.pollingIntervalMillis === "number") {
      state.pollingIntervalMs = Math.max(data.pollingIntervalMillis, 2000)
    }

    for (const item of data.items ?? []) {
      const snippet = (item.snippet ?? {}) as Record<string, unknown>
      const authorDetails = (item.authorDetails ?? {}) as Record<string, unknown>
      const eventType = resolveEventType(snippet)

      // Determine author badge
      const badges: string[] = []
      if (authorDetails.isChatOwner) badges.push("owner")
      if (authorDetails.isChatModerator) badges.push("moderator")
      if (authorDetails.isChatSponsor) badges.push("member")

      const msg: ChatMessage = {
        id: item.id ?? randomUUID(),
        platform: "youtube",
        author: {
          name: String(authorDetails.displayName ?? "Unknown"),
          avatar: authorDetails.profileImageUrl as string | undefined,
          badges: badges.length > 0 ? badges : undefined,
        },
        message: String(snippet.displayMessage ?? ""),
        timestamp: String(snippet.publishedAt ?? new Date().toISOString()),
        eventType,
        donation: extractDonation(snippet),
        subscription: extractSubscription(snippet),
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

function schedulePoll(roomCode: string, state: YouTubeConnectorState) {
  if (!activeConnectors.has(roomCode)) return
  state.intervalId = setTimeout(async () => {
    await pollMessages(roomCode, state)
    schedulePoll(roomCode, state) // Reschedule with potentially updated interval
  }, state.pollingIntervalMs)
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
    pollingIntervalMs: 5_000, // Start conservative, API will adjust
    onTokenRefresh,
    consecutiveErrors: 0,
  }

  publishConnectorStatus(roomCode, "connecting")
  activeConnectors.set(roomCode, state)

  // Initial poll after 3s, then dynamic scheduling
  state.intervalId = setTimeout(async () => {
    await pollMessages(roomCode, state)
    if (state.consecutiveErrors === 0) {
      publishConnectorStatus(roomCode, "connected")
    }
    schedulePoll(roomCode, state)
  }, 3_000)
}

export function stopYouTubeConnector(roomCode: string) {
  const state = activeConnectors.get(roomCode)
  if (!state) return
  if (state.intervalId) clearTimeout(state.intervalId)
  activeConnectors.delete(roomCode)
}

/** Send a message to YouTube live chat. Costs 50 quota units. */
export async function sendYouTubeMessage(
  roomCode: string,
  messageText: string,
): Promise<boolean> {
  const state = activeConnectors.get(roomCode)
  if (!state?.liveChatId) return false

  try {
    const res = await fetch("https://www.googleapis.com/youtube/v3/liveChat/messages?part=snippet", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${state.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          liveChatId: state.liveChatId,
          type: "textMessageEvent",
          textMessageDetails: { messageText },
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
