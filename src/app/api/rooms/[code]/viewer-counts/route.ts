import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { getCachedRoom } from "@/lib/room-cache"
import { getRoomViewerCounts, setRoomViewerCounts } from "@/lib/redis"
import { resolveViewerCounts } from "@/lib/viewer-counts"

/**
 * F-21: cached read of per-platform concurrent viewer counts.
 *
 * GET returns whatever's in Redis (may be empty). POST forces a fresh
 * resolve via the provider adapters and writes the result back. The host
 * studio polls POST every ~30s while live; GET is here for cheap subsequent
 * reads or quick diagnostics.
 *
 * Host-only on both verbs. Provider failures degrade to `null` per
 * platform — the endpoint itself never errors on remote outages.
 */

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ counts: {} })
  const { code } = await params
  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ counts: {} })
  }
  const counts = await getRoomViewerCounts(code).catch(() => ({}))
  return NextResponse.json({ counts })
}

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ counts: {} }, { status: 401 })

  const { code } = await params
  const blocked = await rateLimitGuard(getClientIp(req), "rooms:viewer-counts")
  if (blocked) return blocked

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ counts: {} }, { status: 403 })
  }

  // Parse optional `platforms: string[]` body — caller may pass the subset
  // currently streaming to skip irrelevant providers. Default: empty array
  // (caller passes its known stream-platforms set).
  let platforms: string[] = []
  try {
    const body = await req.json()
    if (Array.isArray(body?.platforms)) {
      platforms = body.platforms.filter((p: unknown): p is string => typeof p === "string")
    }
  } catch {
    /* no body — fall through with empty list */
  }

  if (platforms.length === 0) {
    return NextResponse.json({ counts: {} })
  }

  const counts = await resolveViewerCounts(session.user.id, platforms).catch(() => ({}))
  // Cache for cheap GET reads + so other tabs sharing the same room see
  // the same numbers without hammering provider APIs.
  await setRoomViewerCounts(code, counts).catch(() => undefined)
  return NextResponse.json({ counts })
}
