import { Redis } from "@upstash/redis"
import type { ChatMessage } from "./chat/types"

// Lazy singleton so the Redis client is only instantiated when first used,
// not at module-load time (which would fail during build if env vars are placeholders).
let _redis: Redis | null = null

function getRedis(): Redis {
  if (!_redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? ""
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? ""
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
  type: "GUEST_REQUEST" | "GUEST_ADMITTED" | "GUEST_DENIED" | "STUDIO_ENDED" | "GUEST_LEFT"
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

/**
 * Publish a chat message to the Redis list for a room.
 * The SSE endpoint polls this list every second.
 */
export async function publishChat(roomCode: string, msg: ChatMessage | object): Promise<void> {
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

export async function pollChat(code: string, since: number): Promise<object[]> {
  const raw = await redis.lrange(`room:${code}:chat`, 0, -1)
  return raw
    .map((item) => (typeof item === "string" ? JSON.parse(item) : item))
    .filter((e: { _ts: number }) => e._ts > since)
    .reverse()
}
