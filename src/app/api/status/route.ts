import { NextResponse } from "next/server"
import { RoomServiceClient } from "livekit-server-sdk"

import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

// ── Types ─────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string
  status: "operational" | "degraded" | "down"
  latencyMs: number | null
  message?: string
}

// ── Health checks ─────────────────────────────────────────────────────────────

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { name: "Database", status: "operational", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      name: "Database",
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now()
  try {
    const result = await redis.ping()
    const latencyMs = Date.now() - start
    if (result === "PONG") {
      return { name: "Redis", status: "operational", latencyMs }
    }
    return {
      name: "Redis",
      status: "degraded",
      latencyMs,
      message: `Unexpected ping response: ${String(result)}`,
    }
  } catch (err) {
    return {
      name: "Redis",
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

async function checkLiveKit(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL
  const apiKey = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET

  if (!url || !apiKey || !apiSecret) {
    return {
      name: "LiveKit",
      status: "degraded",
      latencyMs: null,
      message: "Missing LiveKit environment variables",
    }
  }

  const start = Date.now()
  try {
    const httpUrl = url.replace("wss://", "https://").replace("ws://", "http://")
    const svc = new RoomServiceClient(httpUrl, apiKey, apiSecret)
    await svc.listRooms()
    return { name: "LiveKit", status: "operational", latencyMs: Date.now() - start }
  } catch (err) {
    return {
      name: "LiveKit",
      status: "down",
      latencyMs: Date.now() - start,
      message: err instanceof Error ? err.message : "Unknown error",
    }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET() {
  const results = await Promise.allSettled([checkDatabase(), checkRedis(), checkLiveKit()])

  const fallbackNames = ["Database", "Redis", "LiveKit"]
  const services: ServiceStatus[] = results.map((r, i) => {
    if (r.status === "fulfilled") return r.value
    return {
      name: fallbackNames[i],
      status: "down" as const,
      latencyMs: null,
      message: r.reason instanceof Error ? r.reason.message : "Check failed",
    }
  })

  return NextResponse.json(
    { services, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  )
}
