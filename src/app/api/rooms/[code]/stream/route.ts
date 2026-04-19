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

  // G01 — Reject immediately if the room does not exist in Redis.
  const redisForCheck = getRedis()
  const roomExists = await redisForCheck.exists(`room:${code}:info`)
  if (!roomExists) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  // Events and chat use SEPARATE since-pointers to prevent a critical bug:
  // if only `since` is shared, a chat message with a higher _ts would cause
  // all older GUEST_REQUEST events to be permanently filtered out on every
  // subsequent poll. Events use sinceEvents=0 (replay all up to the list cap
  // of 200) so a guest request submitted before the host opened SSE is never
  // missed. Chat uses cursor-based approach for dedup, with timestamp fallback.
  const sinceParam = req.nextUrl.searchParams.get("since")
  // Events always replay from 0 so we never miss a GUEST_REQUEST that arrived
  // before the SSE connection was established. Dedup on the client side via _ts.
  let sinceEvents = 0
  let sinceChat = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 5000
  let lastChatMessageId: string | undefined

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
          // ── Events (all undelivered since sinceEvents) ─────────────────────
          const rawEvents = await redis.lrange(`room:${code}:events`, 0, -1)
          const events = rawEvents
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .filter((e: { _ts: number }) => e._ts > sinceEvents)
            .reverse()

          for (const event of events) {
            const { _ts, ...payload } = event as { _ts: number; [key: string]: unknown }
            sinceEvents = Math.max(sinceEvents, _ts)
            send(payload)
          }

          // ── Chat (cursor-based dedup with timestamp fallback) ──────────────
          const rawChats = await redis.lrange(`room:${code}:chat`, 0, -1)
          const allChats = rawChats
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .reverse() // oldest first

          let chats: Array<{ _ts: number; id?: string; platform?: string; [key: string]: unknown }>
          if (lastChatMessageId) {
            // Cursor-based: find last seen and return newer
            const idx = allChats.findIndex(
              (m: { id?: string }) => m.id === lastChatMessageId
            )
            chats = idx >= 0 ? allChats.slice(idx + 1) : allChats.filter((e: { _ts: number }) => e._ts > sinceChat)
          } else {
            chats = allChats.filter((e: { _ts: number }) => e._ts > sinceChat)
          }

          for (const chat of chats) {
            const { _ts, ...payload } = chat as { _ts: number; id?: string; [key: string]: unknown }
            sinceChat = Math.max(sinceChat, _ts)
            if (chat.id) lastChatMessageId = chat.id
            send({ type: "CHAT_MESSAGE", data: payload })
          }

          consecutiveErrors = 0
        } catch (err) {
          console.error("[SSE] Poll error:", err)
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
          }, 1000)
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
