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
  // `room:{code}:info` is set at room creation and deleted ~5 s after the room
  // ends (via deleteRoomKeys). If the key is absent the room never existed or
  // has already been fully cleaned up.
  //
  // Note: setRoomInfo stores { hostId, createdAt } — no "status" field — so we
  // only check key existence, not contents.
  const redisForCheck = getRedis()
  const roomExists = await redisForCheck.exists(`room:${code}:info`)
  if (!roomExists) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  const sinceParam = req.nextUrl.searchParams.get("since")
  let since = sinceParam ? parseInt(sinceParam) : Date.now() - 1000

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false
      // G02 — consecutive Redis error counter
      let consecutiveErrors = 0

      const send = (data: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          closed = true
        }
      }

      // Send initial ping
      send({ type: "PING" })

      const poll = async () => {
        if (closed) return

        const redis = getRedis()

        try {
          // Poll events
          const rawEvents = await redis.lrange(`room:${code}:events`, 0, -1)
          const events = rawEvents
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .filter((e: { _ts: number }) => e._ts > since)
            .reverse()

          for (const event of events) {
            const { _ts, ...payload } = event as { _ts: number; [key: string]: unknown }
            since = Math.max(since, _ts)
            send(payload)
          }

          // Poll chat
          const rawChats = await redis.lrange(`room:${code}:chat`, 0, -1)
          const chats = rawChats
            .map((e) => (typeof e === "string" ? JSON.parse(e) : e))
            .filter((e: { _ts: number }) => e._ts > since)
            .reverse()

          for (const chat of chats) {
            const { _ts, ...payload } = chat as { _ts: number; [key: string]: unknown }
            since = Math.max(since, _ts)
            send({ type: "CHAT_MESSAGE", data: payload })
          }

          // Successful round — reset error streak
          consecutiveErrors = 0
        } catch (err) {
          console.error("[SSE] Poll error:", err)
          consecutiveErrors += 1

          // G02 — too many consecutive Redis failures; close gracefully
          if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
            send({ type: "CONNECTION_ERROR" })
            closed = true
            try { controller.close() } catch {}
            return
          }
        }

        // Schedule next poll after 1 second
        if (!closed) {
          setTimeout(async () => {
            send({ type: "PING" })
            await poll()
          }, 1000)
        }
      }

      await poll()

      // Clean up when connection closes
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
