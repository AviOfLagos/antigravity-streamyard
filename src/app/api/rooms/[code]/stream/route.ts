/**
 * GET /api/rooms/[code]/stream  (SSE — WAITING ROOM ONLY)
 *
 * After the LiveKit data-channel migration this endpoint is intentionally kept
 * narrow. It only serves guests who are NOT yet inside the LiveKit room
 * (i.e. the "waiting for admission" screen in JoinClient.tsx).
 *
 * Events served here:
 *   GUEST_ADMITTED  — guest was let in; carries the LiveKit token
 *   GUEST_DENIED    — host denied the request
 *   STUDIO_ENDED    — host ended the session while guest was waiting
 *   PING            — keepalive heartbeat
 *   CONNECTION_ERROR — too many consecutive Redis failures
 *
 * Events NOT served here (handled via LiveKit data channels once in-room):
 *   GUEST_REQUEST, GUEST_LEFT, CHAT_MESSAGE, CHAT_CONNECTOR_STATUS,
 *   STREAM_STARTED, STREAM_STOPPED, STREAM_DESTINATION_CHANGED, STREAM_ERROR,
 *   PLATFORM_TOKEN_EXPIRED
 *
 * Redis efficiency:
 *   - Polls every 3 s (was 1 s) — waiting guests can tolerate a small delay.
 *   - Only scans the events list, no chat list at all.
 *   - Filters server-side to only the three relevant event types.
 */

export const runtime = "edge"

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

function getRedis() {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })
}

// Edge-compatible rate limiter (cannot import from src/lib/rate-limit in edge runtime)
let _streamLimiter: Ratelimit | null = null
function getStreamLimiter(): Ratelimit {
  if (!_streamLimiter) {
    _streamLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(3, "1m"),
      prefix: "ratelimit:rooms:stream",
    })
  }
  return _streamLimiter
}

const ROOM_CODE_RE = /^[a-zA-Z0-9]{6,8}$/
const MAX_CONSECUTIVE_ERRORS = 10
const POLL_INTERVAL_MS = 3000
// Only these event types are relevant for a waiting-room guest
const WAITING_ROOM_TYPES = new Set(["GUEST_ADMITTED", "GUEST_DENIED", "STUDIO_ENDED"])

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Validate room code format
  if (!ROOM_CODE_RE.test(code)) {
    return NextResponse.json({ error: "Invalid room code" }, { status: 400 })
  }

  // Rate limit: 3 SSE connections per minute per IP
  try {
    const forwarded = req.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
    const rl = await getStreamLimiter().limit(ip)
    if (!rl.success) {
      const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
      return NextResponse.json(
        { error: "Too many requests", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
          },
        },
      )
    }
  } catch {
    // Fail open — allow the request if rate limiter is broken
  }

  // Reject immediately if the room does not exist in Redis
  const redisForCheck = getRedis()
  const roomExists = await redisForCheck.exists(`room:${code}:info`)
  if (!roomExists) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  // Auth check: caller must be an authenticated host (session cookie) OR a
  // guest with a known pending/approved record in Redis.
  // Edge runtime cannot use next-auth's full `auth()` helper, so we check for
  // the session cookie presence as a lightweight host indicator, and fall back
  // to the guestId Redis check for unauthenticated guests.
  const guestId = req.nextUrl.searchParams.get("guestId") ?? ""
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token")

  if (!sessionCookie) {
    // Not a host session — require a valid guestId that exists in Redis
    if (!guestId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const [isPending, isApproved] = await Promise.all([
      redisForCheck.exists(`room:${code}:pending:${guestId}`),
      redisForCheck.exists(`room:${code}:approved:${guestId}`),
    ])
    if (!isPending && !isApproved) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  // Events always replay from 0 so we never miss a GUEST_ADMITTED that was
  // published before the SSE connection was established.
  const sinceParam = req.nextUrl.searchParams.get("since")
  let sinceEvents = sinceParam ? parseInt(sinceParam, 10) : 0

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      let consecutiveErrors = 0

      const send = (data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      send({ type: "PING" })

      const poll = async () => {
        if (closed) return

        const redis = getRedis()

        try {
          // Only fetch the events list — no chat scanning needed for waiting guests
          const rawEvents = await redis.lrange(`room:${code}:events`, 0, -1)
          const events = rawEvents
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .filter(
              (e: { _ts: number; type: string }) =>
                e._ts > sinceEvents && WAITING_ROOM_TYPES.has(e.type)
            )
            .reverse() // oldest first

          for (const event of events) {
            const { _ts, ...payload } = event as { _ts: number; [key: string]: unknown }
            sinceEvents = Math.max(sinceEvents, _ts)
            send(payload)
          }

          consecutiveErrors = 0
        } catch (err) {
          console.error("[SSE/waiting-room] Poll error:", err)
          consecutiveErrors += 1

          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            send({ type: "CONNECTION_ERROR" })
            closed = true
            try { controller.close() } catch {}
            return
          }
        }

        if (!closed) {
          setTimeout(async () => {
            send({ type: "PING" })
            await poll()
          }, POLL_INTERVAL_MS)
        }
      }

      await poll()

      req.signal.addEventListener("abort", () => {
        closed = true
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
