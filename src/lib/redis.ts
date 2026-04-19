import { Redis } from "@upstash/redis"
import type { ChatMessage } from "./chat/types"
import { stripHtml } from "./sanitize"

// Lazy singleton so the Redis client is only instantiated when first used,
// not at module-load time (which would fail during build if env vars are placeholders).
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    const url = (process.env.UPSTASH_REDIS_REST_URL ?? "").trim()
    const token = (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim()
    _redis = new Redis({ url, token })
  }
  return _redis
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return (getRedis() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

const TTL = 60 * 60 * 24 // 24 hours

// Room info
export async function setRoomInfo(code: string, data: object) {
  await redis.set(`room:${code}:info`, JSON.stringify(data), { ex: TTL })
}

export async function getRoomInfo(code: string) {
  const val = await redis.get(`room:${code}:info`)
  return val ? (typeof val === "string" ? JSON.parse(val) : val) : null
}

// Pending guests
export async function setPendingGuest(code: string, guestId: string, data: object) {
  await redis.set(`room:${code}:pending:${guestId}`, JSON.stringify(data), { ex: TTL })
}

export async function deletePendingGuest(code: string, guestId: string) {
  await redis.del(`room:${code}:pending:${guestId}`)
}

// Approved guests
export async function setApprovedGuest(code: string, guestId: string, token: string) {
  await redis.set(`room:${code}:approved:${guestId}`, token, { ex: TTL })
}

// Cleanup room
export async function deleteRoomKeys(code: string) {
  const keys = await redis.keys(`room:${code}:*`)
  if (keys.length > 0) await redis.del(...keys)
}

// Publish events
export interface RoomEvent {
  type: "GUEST_REQUEST" | "GUEST_ADMITTED" | "GUEST_DENIED" | "STUDIO_ENDED" | "GUEST_LEFT" | "PLATFORM_TOKEN_EXPIRED" | "STREAM_STARTED" | "STREAM_STOPPED" | "STREAM_DESTINATION_CHANGED" | "STREAM_ERROR"
  data?: Record<string, unknown>
}

/**
 * Publish a studio event (guest requests, studio ended, etc.) to the Redis list for a room.
 */
export async function publishEvent(roomCode: string, event: RoomEvent): Promise<void>
export async function publishEvent(roomCode: string, event: Record<string, unknown>): Promise<void>
export async function publishEvent(roomCode: string, event: RoomEvent | Record<string, unknown>): Promise<void> {
  const payload = { ...event, _ts: Date.now() }
  await redis.lpush(`room:${roomCode}:events`, JSON.stringify(payload))
  await redis.ltrim(`room:${roomCode}:events`, 0, 199)
  await redis.expire(`room:${roomCode}:events`, TTL)
}

const DEDUP_TTL = 60 * 60 // 1 hour TTL for dedup keys

/**
 * Publish a chat message to the Redis list for a room.
 * Deduplicates by msg.id + msg.platform using a Redis SET with TTL.
 * The SSE endpoint polls this list every second.
 */
export async function publishChat(roomCode: string, msg: ChatMessage | object): Promise<void> {
  // Sanitize incoming chat message text — strip HTML, preserve emoji/unicode, limit to 2000 chars
  const msgRecord = msg as Record<string, unknown>
  if (typeof msgRecord.message === "string") {
    msgRecord.message = stripHtml(msgRecord.message).trim().slice(0, 2000)
  }
  // Sanitize author name if present
  if (
    msgRecord.author &&
    typeof msgRecord.author === "object" &&
    typeof (msgRecord.author as Record<string, unknown>).name === "string"
  ) {
    ;(msgRecord.author as Record<string, unknown>).name = stripHtml(
      (msgRecord.author as Record<string, unknown>).name as string,
    ).trim().slice(0, 50)
  }

  // Build dedup key from message id + platform
  const dedupId = `${msgRecord.id ?? ""}:${msgRecord.platform ?? ""}`
  const dedupKey = `room:${roomCode}:chat:seen`

  // Check if already seen — SISMEMBER returns 1 if exists
  const alreadySeen = await redis.sismember(dedupKey, dedupId)
  if (alreadySeen) return

  // Mark as seen
  await redis.sadd(dedupKey, dedupId)
  await redis.expire(dedupKey, DEDUP_TTL)

  const payload = { ...msg, _ts: Date.now() }
  // LPUSH so newest items are at head; keep last 500 messages
  await redis.lpush(`room:${roomCode}:chat`, JSON.stringify(payload))
  await redis.ltrim(`room:${roomCode}:chat`, 0, 499)
  await redis.expire(`room:${roomCode}:chat`, TTL)
}

// Poll for new events since a given timestamp
export async function pollEvents(code: string, since: number): Promise<RoomEvent[]> {
  const raw = await redis.lrange(`room:${code}:events`, 0, -1)
  return raw
    .map((item) => (typeof item === "string" ? JSON.parse(item) : item))
    .filter((e) => e._ts > since)
    .reverse()
}

// Studio host state persistence (F-11)
export async function saveStudioState(code: string, state: object): Promise<void> {
  try {
    await redis.set(`room:${code}:hostState`, JSON.stringify(state), { ex: TTL })
  } catch (err) {
    console.warn("[saveStudioState] Redis write failed, state not persisted:", err)
  }
}

export async function loadStudioState(code: string): Promise<object | null> {
  try {
    const val = await redis.get(`room:${code}:hostState`)
    if (!val) return null
    return typeof val === "string" ? JSON.parse(val) : (val as object)
  } catch (err) {
    console.warn("[loadStudioState] Redis read failed, using defaults:", err)
    return null
  }
}

/**
 * Poll chat messages from Redis.
 * Supports both cursor-based (lastMessageId) and timestamp-based (since) filtering.
 * Cursor-based is preferred: returns only messages newer than the cursor.
 */
export async function pollChat(
  code: string,
  since: number,
  lastMessageId?: string
): Promise<object[]> {
  const raw = await redis.lrange(`room:${code}:chat`, 0, -1)
  const all = raw
    .map((item) => (typeof item === "string" ? JSON.parse(item) : item))
    .reverse() // oldest first

  if (lastMessageId) {
    // Cursor-based: find the index of the last seen message and return everything after
    const idx = all.findIndex(
      (m: { id?: string; platform?: string }) =>
        `${m.id ?? ""}:${m.platform ?? ""}` === lastMessageId ||
        m.id === lastMessageId
    )
    if (idx >= 0) {
      return all.slice(idx + 1)
    }
    // If cursor not found, fall back to timestamp-based
  }

  // Timestamp-based fallback
  return all.filter((e: { _ts: number }) => e._ts > since)
}
