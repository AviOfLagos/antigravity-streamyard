"use client"

import { useEffect, useRef, useState } from "react"

import { useStudioStore } from "@/store/studio"

/** Default refresh cadence — keeps well under YouTube's 10k units/day quota
 *  for a single host, leaves Twitch / Kick comfortably under their limits. */
const REFRESH_MS = 30_000

interface UseViewerCountsOptions {
  /** Pause polling when false. Studio passes `isLive` so we only spend
   *  provider quota while there's actually a stream to count. */
  enabled?: boolean
}

/**
 * F-21: polls /api/rooms/[code]/viewer-counts with the host's currently
 * streaming platforms, returns a per-platform `number | null` map for the
 * header pills to render. Null = unknown / provider failure / not live.
 *
 * Cached on the server in Redis for 5 minutes, so quick re-mounts and
 * multiple host tabs don't blow through provider quota.
 */
export default function useViewerCounts(
  roomCode: string,
  opts: UseViewerCountsOptions = {},
): Record<string, number | null> {
  const enabled = opts.enabled ?? true
  const streamPlatforms = useStudioStore((s) => s.streamPlatforms)
  const [counts, setCounts] = useState<Record<string, number | null>>({})
  const cancelledRef = useRef(false)

  useEffect(() => {
    cancelledRef.current = false

    if (!enabled || streamPlatforms.length === 0) {
      setCounts({})
      return () => {
        cancelledRef.current = true
      }
    }

    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}/viewer-counts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ platforms: streamPlatforms }),
        })
        if (!res.ok) return
        const data = await res.json()
        if (cancelledRef.current) return
        if (data?.counts && typeof data.counts === "object") {
          setCounts(data.counts as Record<string, number | null>)
        }
      } catch {
        /* non-critical — pill falls back to "—" placeholder */
      }
    }

    // First refresh shortly after mount so the badge isn't empty for 30s.
    const initialDelay = setTimeout(fetchOnce, 1_500)
    const id = setInterval(fetchOnce, REFRESH_MS)
    return () => {
      cancelledRef.current = true
      clearTimeout(initialDelay)
      clearInterval(id)
    }
  }, [roomCode, enabled, streamPlatforms])

  return counts
}
