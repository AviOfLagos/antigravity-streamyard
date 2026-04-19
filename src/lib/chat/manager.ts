import { PlatformType } from "@prisma/client"

import { refreshIfNeeded, type PlatformConnectionRow } from "@/lib/auth/token-refresh"
import { publishEvent } from "@/lib/redis"
import type { ConnectorStatus } from "./types"
import { startTwitchConnector, stopTwitchConnector } from "./twitch"
import { startYouTubeConnector, stopYouTubeConnector } from "./youtube"
import { startKickConnector, stopKickConnector } from "./kick"
import { startTikTokConnector, stopTikTokConnector } from "./tiktok"

export interface PlatformConnectionData {
  platform: string | PlatformType
  channelName: string
  accessToken?: string | null
  /** Full PlatformConnection row for token refresh (optional for backward compat) */
  connectionRow?: PlatformConnectionRow
}

// ── Connector health tracking ─────────────────────────────────────────────────

/** Abort controllers per room — used to cancel all retries when room ends */
const roomAbortControllers = new Map<string, AbortController>()

const MAX_RETRIES = 5
const BACKOFF_BASE_MS = 1000

/**
 * Publish connector status as an SSE event so the client can display per-platform health.
 */
async function publishConnectorStatus(
  roomCode: string,
  platform: string,
  status: ConnectorStatus,
  error?: string,
) {
  await publishEvent(roomCode, {
    type: "CHAT_CONNECTOR_STATUS" as unknown as "GUEST_REQUEST", // SSE stream sends raw JSON
    data: { platform, status, ...(error ? { error } : {}) },
  } as unknown as import("@/lib/redis").RoomEvent)
}

/**
 * Sleep that respects an AbortSignal — resolves immediately if aborted.
 */
function abortableSleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) { resolve(); return }
    const timer = setTimeout(resolve, ms)
    signal.addEventListener("abort", () => { clearTimeout(timer); resolve() }, { once: true })
  })
}

/**
 * Wrap a connector start function with exponential backoff retry.
 * Each connector runs independently — one failing does not affect others.
 */
async function startWithRetry(
  roomCode: string,
  platformName: string,
  startFn: () => Promise<void>,
  signal: AbortSignal,
): Promise<void> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (signal.aborted) return

    const status: ConnectorStatus = attempt === 0 ? "connecting" : "reconnecting"
    await publishConnectorStatus(roomCode, platformName, status).catch(() => {})

    try {
      await startFn()
      // Success
      await publishConnectorStatus(roomCode, platformName, "connected").catch(() => {})
      return
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(
        `[ChatManager] ${platformName} connector attempt ${attempt + 1}/${MAX_RETRIES} failed:`,
        errMsg,
      )

      if (attempt < MAX_RETRIES - 1 && !signal.aborted) {
        const backoffMs = BACKOFF_BASE_MS * Math.pow(2, attempt) // 1s, 2s, 4s, 8s, 16s
        await abortableSleep(backoffMs, signal)
      }
    }
  }

  // All retries exhausted
  if (!signal.aborted) {
    await publishConnectorStatus(roomCode, platformName, "failed", "Max retries exceeded").catch(() => {})
    console.error(`[ChatManager] ${platformName} connector failed after ${MAX_RETRIES} attempts`)
  }
}

export async function startConnectors(roomCode: string, platforms: PlatformConnectionData[]) {
  // Create a single abort controller for this room's connectors
  const existingAbort = roomAbortControllers.get(roomCode)
  if (existingAbort) existingAbort.abort()
  const abortController = new AbortController()
  roomAbortControllers.set(roomCode, abortController)

  const promises = platforms.map(async (p) => {
    // Normalize platform to uppercase for enum comparison
    const plat = (typeof p.platform === "string" ? p.platform.toUpperCase() : p.platform) as string
    const platformLower = plat.toLowerCase()

    // Per-connector isolation — each connector is wrapped independently
    try {
      // Refresh token if needed before starting the connector
      let accessToken = p.accessToken
      if (p.connectionRow && (plat === PlatformType.YOUTUBE || plat === PlatformType.TWITCH)) {
        const refreshed = await refreshIfNeeded(p.connectionRow, roomCode)
        if (refreshed.accessToken) {
          accessToken = refreshed.accessToken
        }
      }

      if (plat === PlatformType.TWITCH) {
        await startWithRetry(
          roomCode,
          platformLower,
          () => startTwitchConnector(roomCode, p.channelName),
          abortController.signal,
        )
      } else if (plat === PlatformType.YOUTUBE && accessToken) {
        const onTokenRefresh = p.connectionRow
          ? async (): Promise<string | null> => {
              try {
                const refreshed = await refreshIfNeeded(p.connectionRow!, roomCode)
                return refreshed.accessToken ?? null
              } catch {
                return null
              }
            }
          : undefined
        await startWithRetry(
          roomCode,
          platformLower,
          () => startYouTubeConnector(roomCode, accessToken!, onTokenRefresh),
          abortController.signal,
        )
      } else if (plat === PlatformType.KICK) {
        await startWithRetry(
          roomCode,
          platformLower,
          () => startKickConnector(roomCode, p.channelName),
          abortController.signal,
        )
      } else if (plat === PlatformType.TIKTOK) {
        await startWithRetry(
          roomCode,
          platformLower,
          () => startTikTokConnector(roomCode, p.channelName),
          abortController.signal,
        )
      }
    } catch (err) {
      // Per-connector error isolation — log and continue, don't affect others
      console.error(`[ChatManager] Failed to start ${p.platform} connector:`, err)
    }
  })

  await Promise.allSettled(promises)
}

export async function stopConnectors(roomCode: string) {
  // Abort all retry loops for this room
  const abortController = roomAbortControllers.get(roomCode)
  if (abortController) {
    abortController.abort()
    roomAbortControllers.delete(roomCode)
  }

  await Promise.allSettled([
    stopTwitchConnector(roomCode),
    stopYouTubeConnector(roomCode),
    stopKickConnector(roomCode),
    stopTikTokConnector(roomCode),
  ])
}
