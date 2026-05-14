/**
 * F-21: live concurrent-viewer counts per streaming platform.
 *
 * Provider adapters return `null` on any failure (missing token, API
 * non-2xx, throttle, parse error). Caller maps null → "—" placeholder so
 * UX never breaks on a single platform's outage.
 *
 * Per-platform feasibility today:
 *   - YouTube : liveBroadcasts.list + liveStreamingDetails.concurrentViewers (OAuth)
 *   - Twitch  : Helix /streams?user_login (OAuth user token + Client-ID)
 *   - Kick    : /api/v2/channels/{slug}.livestream.viewer_count (public)
 *   - TikTok  : Partner-only LIVE API — always returns null today.
 */

import { prisma } from "@/lib/prisma"

const YT_API = "https://www.googleapis.com/youtube/v3"
const TWITCH_HELIX = "https://api.twitch.tv/helix"
const KICK_API = "https://kick.com/api/v2/channels"

// ── YouTube ───────────────────────────────────────────────────────────────────

interface YTBroadcast {
  id: string
  status?: { lifeCycleStatus?: string }
  liveStreamingDetails?: { concurrentViewers?: string }
}

async function getYouTubeViewerCount(accessToken: string | null | undefined): Promise<number | null> {
  if (!accessToken) return null
  try {
    const url = new URL(`${YT_API}/liveBroadcasts`)
    url.searchParams.set("part", "status,liveStreamingDetails")
    url.searchParams.set("broadcastStatus", "active")
    url.searchParams.set("broadcastType", "all")
    url.searchParams.set("maxResults", "1")
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { items?: YTBroadcast[] }
    const broadcast = data.items?.[0]
    const raw = broadcast?.liveStreamingDetails?.concurrentViewers
    if (!raw) return null
    const n = Number.parseInt(raw, 10)
    return Number.isFinite(n) && n >= 0 ? n : null
  } catch {
    return null
  }
}

// ── Twitch ────────────────────────────────────────────────────────────────────

interface TwitchStream {
  viewer_count: number
}

async function getTwitchViewerCount(
  accessToken: string | null | undefined,
  channelLogin: string | null | undefined,
): Promise<number | null> {
  const clientId = process.env.TWITCH_CLIENT_ID
  if (!accessToken || !clientId || !channelLogin) return null
  try {
    const slug = channelLogin.replace(/^@/, "").trim().toLowerCase()
    if (!slug) return null
    const res = await fetch(`${TWITCH_HELIX}/streams?user_login=${encodeURIComponent(slug)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": clientId,
      },
    })
    if (!res.ok) return null
    const data = (await res.json()) as { data?: TwitchStream[] }
    const stream = data.data?.[0]
    if (!stream) return null // offline
    return typeof stream.viewer_count === "number" ? stream.viewer_count : null
  } catch {
    return null
  }
}

// ── Kick ──────────────────────────────────────────────────────────────────────

interface KickChannel {
  livestream?: { viewer_count?: number; is_live?: boolean } | null
}

async function getKickViewerCount(channelSlug: string | null | undefined): Promise<number | null> {
  if (!channelSlug) return null
  try {
    const slug = channelSlug.replace(/^@/, "").trim().toLowerCase()
    if (!slug) return null
    const res = await fetch(`${KICK_API}/${encodeURIComponent(slug)}`, {
      headers: { Accept: "application/json" },
    })
    if (!res.ok) return null
    const data = (await res.json()) as KickChannel
    const ls = data.livestream
    if (!ls?.is_live) return null
    return typeof ls.viewer_count === "number" ? ls.viewer_count : null
  } catch {
    return null
  }
}

// ── Aggregator ────────────────────────────────────────────────────────────────

export type ViewerCounts = Record<string, number | null>

/**
 * Resolve concurrent viewer counts for the host's selected platforms.
 * Keys are lowercased platform identifiers; values are null when the
 * count is unknown / unavailable.
 */
export async function resolveViewerCounts(
  userId: string,
  platforms: string[],
): Promise<ViewerCounts> {
  if (platforms.length === 0) return {}

  const upper = platforms.map((p) => p.toUpperCase())
  const conns = await prisma.platformConnection.findMany({
    where: {
      userId,
      platform: { in: upper as unknown as Array<"YOUTUBE" | "TWITCH" | "KICK" | "TIKTOK"> },
    },
    select: { platform: true, channelName: true, accessToken: true },
  })

  const out: ViewerCounts = {}
  await Promise.all(
    conns.map(async (conn) => {
      const key = conn.platform.toLowerCase()
      try {
        if (key === "youtube") {
          out[key] = await getYouTubeViewerCount(conn.accessToken)
        } else if (key === "twitch") {
          out[key] = await getTwitchViewerCount(conn.accessToken, conn.channelName)
        } else if (key === "kick") {
          out[key] = await getKickViewerCount(conn.channelName)
        } else {
          // TikTok + unknown — surfaced as null placeholder.
          out[key] = null
        }
      } catch {
        out[key] = null
      }
    })
  )

  return out
}

/** Compact "1.2K / 12.4K / 1.1M" formatting for the pill badge. */
export function formatViewerCount(n: number): string {
  if (n < 1000) return String(n)
  if (n < 10_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`
  if (n < 1_000_000) return `${Math.round(n / 1000)}K`
  if (n < 10_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  return `${Math.round(n / 1_000_000)}M`
}
