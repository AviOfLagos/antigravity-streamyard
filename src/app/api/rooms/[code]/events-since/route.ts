/**
 * GET /api/rooms/[code]/events-since
 *
 * Cursor-based event + chat endpoint for RoomEventRelay (host only).
 * Returns only items newer than the provided timestamps so the host can relay
 * them to guests via LiveKit data channels, eliminating per-client SSE polling.
 *
 * Query params:
 *   eventsFrom  — unix ms timestamp; return events with _ts > this value
 *   chatFrom    — unix ms timestamp; return chat messages with _ts > this value
 *   lastChatId  — (optional) cursor ID of last seen chat message for exact dedup
 *
 * This endpoint is intentionally NOT on the edge runtime so it can import
 * from src/lib/redis (singleton Redis client used throughout the app).
 *
 * Security: only authenticated hosts should call this. We validate the session
 * and confirm the caller is the room host before returning data.
 */

import { type NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { pollEventsSince, pollChatSince } from "@/lib/redis"
import { getCachedRoom } from "@/lib/room-cache"
import { RoomCodeSchema } from "@/lib/schemas"

const ROOM_CODE_RE = /^[a-zA-Z0-9]{6,8}$/

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { code } = await params

  const blocked = await rateLimitGuard(getClientIp(req), "rooms:events-since")
  if (blocked) return blocked

  if (!ROOM_CODE_RE.test(code)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  // Validate code via schema
  const codeResult = RoomCodeSchema.safeParse(code)
  if (!codeResult.success) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  // Ensure the caller is actually the host of this room
  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sp = req.nextUrl.searchParams
  const eventsFrom = parseInt(sp.get("eventsFrom") ?? "0", 10) || 0
  const chatFrom = parseInt(sp.get("chatFrom") ?? "0", 10) || 0
  const lastChatId = sp.get("lastChatId") ?? undefined

  const [events, chat] = await Promise.all([
    pollEventsSince(code, eventsFrom),
    pollChatSince(code, chatFrom, lastChatId),
  ])

  return NextResponse.json({ events, chat })
}
