import Link from "next/link"
import { RoomServiceClient } from "livekit-server-sdk"
import { Zap } from "lucide-react"

import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

export const revalidate = 0

// ── Types ────────────────────────────────────────────────────────────────────

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
    return {
      name: "Database",
      status: "operational",
      latencyMs: Date.now() - start,
    }
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusColors(status: ServiceStatus["status"]) {
  switch (status) {
    case "operational":
      return {
        text: "text-emerald-400",
        dot: "bg-emerald-400",
        bg: "bg-emerald-500/10",
        label: "Operational",
      }
    case "degraded":
      return {
        text: "text-amber-400",
        dot: "bg-amber-400",
        bg: "bg-amber-500/10",
        label: "Degraded",
      }
    case "down":
      return {
        text: "text-red-400",
        dot: "bg-red-400",
        bg: "bg-red-500/10",
        label: "Down",
      }
  }
}

function overallBadge(services: ServiceStatus[]) {
  if (services.some((s) => s.status === "down")) {
    return { text: "Service disruption", className: "bg-red-500/10 text-red-400 border border-red-500/20" }
  }
  if (services.some((s) => s.status === "degraded")) {
    return { text: "Partial degradation", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" }
  }
  return { text: "All systems operational", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" }
}

const SERVICE_SUBTITLES: Record<string, string> = {
  Database: "Neon Postgres — user data & sessions",
  Redis: "Upstash Redis — events & chat relay",
  LiveKit: "WebRTC media server — live rooms",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatusPage() {
  const results = await Promise.allSettled([checkDatabase(), checkRedis(), checkLiveKit()])

  const services: ServiceStatus[] = results.map((r, i) => {
    const fallbackNames = ["Database", "Redis", "LiveKit"]
    if (r.status === "fulfilled") return r.value
    return {
      name: fallbackNames[i],
      status: "down" as const,
      latencyMs: null,
      message: r.reason instanceof Error ? r.reason.message : "Check failed",
    }
  })

  const badge = overallBadge(services)
  const checkedAt = new Date().toLocaleTimeString()

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Nav */}
      <nav className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span aria-hidden>←</span> Back to home
        </Link>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="font-bold text-white">Zerocast</span>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-4">System Status</h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${badge.className}`}
            >
              {badge.text}
            </span>
            <span className="text-sm text-gray-500">Last checked: {checkedAt}</span>
          </div>
        </div>

        {/* Service cards */}
        <div className="flex flex-col gap-3 mb-12">
          {services.map((service) => {
            const colors = statusColors(service.status)
            return (
              <div
                key={service.name}
                className="bg-[#111111] border border-white/6 rounded-2xl px-5 py-4 flex items-center justify-between"
              >
                {/* Left: name + subtitle */}
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-medium">{service.name}</span>
                  <span className="text-gray-500 text-sm">
                    {SERVICE_SUBTITLES[service.name] ?? ""}
                  </span>
                  {service.message && service.status !== "operational" && (
                    <span className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={service.message}>
                      {service.message}
                    </span>
                  )}
                </div>

                {/* Right: latency + status */}
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {service.status === "operational" && service.latencyMs !== null && (
                    <span className="bg-white/[0.04] text-gray-400 text-xs px-2 py-0.5 rounded-full">
                      {service.latencyMs}ms
                    </span>
                  )}
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${colors.bg}`}>
                    <span
                      className={`inline-block w-2.5 h-2.5 rounded-full ${colors.dot} ${service.status === "operational" ? "animate-pulse" : ""}`}
                    />
                    <span className={`text-xs font-medium ${colors.text}`}>{colors.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Refresh */}
        <div className="mb-12">
          <form action="">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-white border border-white/6 rounded-lg px-4 py-2 transition-colors hover:bg-white/[0.04]"
            >
              Refresh
            </button>
          </form>
        </div>

        {/* Feature status */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Feature Status</h2>
          <div className="flex flex-col gap-2">
            {[
              { name: "Studio & Video Grid", status: "Live", color: "emerald" },
              { name: "Guest Join & Queue", status: "Live", color: "emerald" },
              { name: "Auto-Admit Mode", status: "Live", color: "emerald" },
              { name: "Host Moderation (Mute/Kick)", status: "Live", color: "emerald" },
              { name: "Multi-Platform Chat (YouTube, Twitch, Kick, TikTok)", status: "Live", color: "emerald" },
              { name: "Chat Reply (Send to YouTube & Twitch)", status: "Live", color: "emerald" },
              { name: "Donations & Events (Super Chat, Bits, Gifts)", status: "Live", color: "emerald" },
              { name: "Multi-Platform Streaming", status: "Live", color: "emerald" },
              { name: "Guest Lead Capture", status: "Live", color: "emerald" },
              { name: "Session Summary", status: "Live", color: "emerald" },
              { name: "Feedback System", status: "Live", color: "emerald" },
              { name: "Unit Test Suite (114 tests)", status: "Live", color: "emerald" },
              { name: "Chat Reply to Kick & TikTok", status: "Planned", color: "gray" },
              { name: "RTMP Custom Ingest", status: "Planned", color: "gray" },
            ].map((feature) => (
              <div
                key={feature.name}
                className="flex items-center justify-between bg-[#111111] border border-white/6 rounded-xl px-4 py-2.5"
              >
                <span className="text-sm text-gray-300">{feature.name}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  feature.color === "emerald"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-gray-500/10 text-gray-500"
                }`}>
                  {feature.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Incident history */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Incidents</h2>
          <div className="bg-[#111111] border border-white/6 rounded-2xl px-5 py-6">
            <p className="text-gray-500 text-sm">No incidents reported in the last 30 days.</p>
          </div>
        </section>

        {/* Version */}
        <div className="text-center text-gray-600 text-xs">
          Zerocast v1.2.0 · <Link href="/changelog" className="text-gray-500 hover:text-gray-300 transition-colors">View changelog</Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/6 py-8 px-6">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <span className="text-gray-600 text-sm">&copy; 2026 Zerocast</span>
          <Link
            href="/feedback"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Report an issue
          </Link>
        </div>
      </footer>
    </div>
  )
}
