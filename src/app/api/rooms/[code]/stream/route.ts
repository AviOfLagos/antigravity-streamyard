export const runtime = "edge"

import { NextRequest } from "next/server"
import { Redis } from "@upstash/redis"

function getRedis() {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const sinceParam = req.nextUrl.searchParams.get("since")
  let since = sinceParam ? parseInt(sinceParam) : Date.now() - 1000

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false

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
        } catch (err) {
          console.error("[SSE] Poll error:", err)
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
