/**
 * F-26: shared loader for the public session recap. Used by both the public
 * GET /api/rooms/[code]/recap/public endpoint and the /recap/[code] server
 * component so the sanitisation rules live in one place.
 *
 * Never exposes: host email, guest emails, raw chat content, stream keys,
 * OAuth tokens, recording URL. Only counts + duration + platform list.
 */

import { RoomStatus } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"
import { redis } from "@/lib/redis"

export interface PublicRecap {
  code: string
  endedAt: string
  durationSeconds: number
  participantCount: number
  peakParticipants: number
  messageCount: number
  platforms: string[]
  /** Host's display name (already in PlatformConnection.channelName territory; safe to expose). */
  hostName: string | null
  /** Room title set by the host. Safe — chosen for public broadcast. */
  title: string | null
}

interface RawSummary {
  code?: string
  endedAt?: string
  durationSeconds?: number
  participantCount?: number
  peakParticipants?: number
  messageCount?: number
  platforms?: string[]
  // recordingUrl etc. are intentionally not in the public shape
}

/**
 * Load a sanitised recap for `code`. Returns null when the recap is not
 * available — the route handler should map that to a 404.
 *
 * Availability rules:
 *  - Room must exist
 *  - Room must be ENDED (LOBBY / LIVE → recap not shown publicly yet)
 *  - Falls back to Prisma-derived stats when the Redis summary has expired.
 */
export async function loadPublicRecap(code: string): Promise<PublicRecap | null> {
  const room = await getCachedRoom(code)
  if (!room) return null
  if (room.status !== RoomStatus.ENDED) return null

  // Read Redis summary (the same one /api/rooms/[code]/end writes).
  const raw = await redis.get(`session:summary:${code}`).catch(() => null)
  let summary: RawSummary | null = null
  if (raw) {
    try {
      summary = typeof raw === "string" ? JSON.parse(raw) : (raw as RawSummary)
    } catch {
      summary = null
    }
  }

  // Fallback when the Redis key has expired (24h TTL) — derive minimal stats
  // from Prisma. Public-safe; uses no PII columns.
  if (!summary && room.endedAt) {
    const participants = await prisma.participant.count({ where: { roomId: room.id } })
    const durationMs = room.endedAt.getTime() - room.createdAt.getTime()
    summary = {
      code,
      endedAt: room.endedAt.toISOString(),
      durationSeconds: Math.floor(durationMs / 1000),
      participantCount: participants,
      peakParticipants: participants,
      messageCount: 0,
      platforms: [],
    }
  }
  if (!summary) return null

  // Host name = User.name, sanitised. Email never leaks.
  const host = await prisma.user.findUnique({
    where: { id: room.hostId },
    select: { name: true },
  })

  return {
    code,
    endedAt: summary.endedAt ?? room.endedAt?.toISOString() ?? new Date().toISOString(),
    durationSeconds: Math.max(0, summary.durationSeconds ?? 0),
    participantCount: Math.max(0, summary.participantCount ?? 0),
    peakParticipants: Math.max(
      summary.peakParticipants ?? 0,
      summary.participantCount ?? 0,
    ),
    messageCount: Math.max(0, summary.messageCount ?? 0),
    platforms: Array.isArray(summary.platforms) ? summary.platforms : [],
    hostName: host?.name ?? null,
    title: room.title ?? null,
  }
}

export function formatRecapDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m} min`
}
