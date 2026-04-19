export const runtime = "edge"

import { Redis } from "@upstash/redis"
import { type NextRequest, NextResponse } from "next/server"

function getRedis() {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })
}

const MAX_CONSECUTIVE_ERRORS = 10

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

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
  // missed. Chat uses a short lookback (5 s) to avoid replaying full history.
  const sinceParam = req.nextUrl.searchParams.get("since")
  let sinceEvents = sinceParam ? parseInt(sinceParam, 10) : 0
  let sinceChat = Date.now() - 5000

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

          // ── Chat (short window — avoid replaying full chat history) ─────────
          const rawChats = await redis.lrange(`room:${code}:chat`, 0, -1)
          const chats = rawChats
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .filter((e: { _ts: number }) => e._ts > sinceChat)
            .reverse()

          for (const chat of chats) {
            const { _ts, ...payload } = chat as { _ts: number; [key: string]: unknown }
            sinceChat = Math.max(sinceChat, _ts)
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
