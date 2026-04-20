import type { Room } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const ROOM_CACHE_TTL = 60 // seconds

function cacheKey(code: string) {
  return `cache:room:${code}`
}

/**
 * Get a room by code — Redis cache first, DB fallback.
 * Returns null if the room doesn't exist.
 */
export async function getCachedRoom(code: string): Promise<Room | null> {
  // Try Redis first
  try {
    const cached = await redis.get(cacheKey(code))
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached
      // Rehydrate Date fields that were serialized as ISO strings
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
      } as Room
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // Cache miss — fetch from DB
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room) return null

  // Warm cache (best-effort)
  try {
    await redis.set(cacheKey(code), JSON.stringify(room), { ex: ROOM_CACHE_TTL })
  } catch {
    // Non-critical — next request will retry
  }

  return room
}

/**
 * Invalidate cached room after status changes (end, go-live, etc.).
 */
export async function invalidateRoomCache(code: string): Promise<void> {
  try {
    await redis.del(cacheKey(code))
  } catch {
    // Non-critical
  }
}

/**
 * Warm the cache after creating or updating a room.
 */
export async function warmRoomCache(code: string, room: Room): Promise<void> {
  try {
    await redis.set(cacheKey(code), JSON.stringify(room), { ex: ROOM_CACHE_TTL })
  } catch {
    // Non-critical
  }
}
