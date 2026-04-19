import { PlatformType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { publishEvent } from "@/lib/redis"

// ── Types ────────────────────────────────────────────────────────────────────

/** Shape of a PlatformConnection row from Prisma */
export interface PlatformConnectionRow {
  id: string
  userId: string
  platform: PlatformType
  channelId: string
  channelName: string
  accessToken: string | null
  refreshToken: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Successful token refresh response from Google OAuth2 */
interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope?: string
  // Google does NOT return a new refresh_token on refresh
}

/** Successful token refresh response from Twitch OAuth2 */
interface TwitchTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string[]
  token_type: string
}

/** Error response from OAuth2 endpoints */
interface OAuthErrorResponse {
  error: string
  error_description?: string
}

export interface TokenRefreshResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresAt?: Date
  error?: string
}

// ── Constants ────────────────────────────────────────────────────────────────

/** Refresh if token expires within this many milliseconds */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000 // 5 minutes

/** Skip refresh if token was refreshed in the last N milliseconds (concurrent protection) */
const RECENT_REFRESH_WINDOW_MS = 30 * 1000 // 30 seconds

// ── Core Functions ───────────────────────────────────────────────────────────

/**
 * Returns true if the connection's token expires within 5 minutes.
 * Returns false if there is no expiresAt (Kick/TikTok, or missing data).
 */
export function needsRefresh(connection: PlatformConnectionRow): boolean {
  if (!connection.expiresAt) return false
  const expiresAt = connection.expiresAt instanceof Date
    ? connection.expiresAt.getTime()
    : new Date(connection.expiresAt).getTime()
  return expiresAt - Date.now() < REFRESH_THRESHOLD_MS
}

/**
 * Returns true if the token has already expired.
 */
export function isExpired(connection: PlatformConnectionRow): boolean {
  if (!connection.expiresAt) return false
  const expiresAt = connection.expiresAt instanceof Date
    ? connection.expiresAt.getTime()
    : new Date(connection.expiresAt).getTime()
  return expiresAt < Date.now()
}

/**
 * Returns the token health status for display purposes.
 */
export function getTokenHealth(connection: PlatformConnectionRow): "connected" | "expiring_soon" | "expired" | "no_token" {
  // Kick and TikTok don't use OAuth tokens
  if (connection.platform === PlatformType.KICK || connection.platform === PlatformType.TIKTOK) {
    return "no_token"
  }
  if (!connection.expiresAt || !connection.accessToken) {
    return "no_token"
  }
  if (isExpired(connection)) return "expired"
  // "Expiring soon" = within 1 hour
  const expiresAt = connection.expiresAt instanceof Date
    ? connection.expiresAt.getTime()
    : new Date(connection.expiresAt).getTime()
  if (expiresAt - Date.now() < 60 * 60 * 1000) return "expiring_soon"
  return "connected"
}

/**
 * Refresh a YouTube (Google) OAuth2 access token.
 */
export async function refreshYouTubeToken(connection: PlatformConnectionRow): Promise<TokenRefreshResult> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, error: "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET" }
  }
  if (!connection.refreshToken) {
    return { success: false, error: "No refresh token available for YouTube" }
  }

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
      }),
    })

    const data = await res.json() as GoogleTokenResponse | OAuthErrorResponse

    if (!res.ok || "error" in data) {
      const errorData = data as OAuthErrorResponse
      return {
        success: false,
        error: `YouTube refresh failed: ${errorData.error} — ${errorData.error_description ?? "unknown"}`,
      }
    }

    const tokenData = data as GoogleTokenResponse
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    return {
      success: true,
      accessToken: tokenData.access_token,
      // Google does not return a new refresh token; keep the existing one
      refreshToken: connection.refreshToken,
      expiresAt,
    }
  } catch (err) {
    return {
      success: false,
      error: `YouTube refresh network error: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Refresh a Twitch OAuth2 access token.
 */
export async function refreshTwitchToken(connection: PlatformConnectionRow): Promise<TokenRefreshResult> {
  const clientId = process.env.TWITCH_CLIENT_ID
  const clientSecret = process.env.TWITCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return { success: false, error: "Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET" }
  }
  if (!connection.refreshToken) {
    return { success: false, error: "No refresh token available for Twitch" }
  }

  try {
    const res = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: connection.refreshToken,
      }),
    })

    const data = await res.json() as TwitchTokenResponse | OAuthErrorResponse

    if (!res.ok || "error" in data) {
      const errorData = data as OAuthErrorResponse
      return {
        success: false,
        error: `Twitch refresh failed: ${errorData.error} — ${errorData.error_description ?? "unknown"}`,
      }
    }

    const tokenData = data as TwitchTokenResponse
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)

    return {
      success: true,
      accessToken: tokenData.access_token,
      // Twitch returns a new refresh token on each refresh
      refreshToken: tokenData.refresh_token,
      expiresAt,
    }
  } catch (err) {
    return {
      success: false,
      error: `Twitch refresh network error: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Checks if a connection needs a token refresh, and if so, refreshes it.
 * Updates the database with the new token.
 * Idempotent: safe to call concurrently — if the token was recently refreshed, skips.
 *
 * @param connection - The PlatformConnection row from the database
 * @param roomCode - Optional room code; if provided, publishes PLATFORM_TOKEN_EXPIRED on failure
 * @returns The updated connection (with new token if refreshed), or the original if no refresh needed
 */
export async function refreshIfNeeded(
  connection: PlatformConnectionRow,
  roomCode?: string,
): Promise<PlatformConnectionRow> {
  // Skip platforms that don't use OAuth tokens
  if (connection.platform === PlatformType.KICK || connection.platform === PlatformType.TIKTOK) {
    return connection
  }

  // Skip if no refresh token
  if (!connection.refreshToken) {
    return connection
  }

  // Skip if token doesn't need refresh
  if (!needsRefresh(connection)) {
    return connection
  }

  // Concurrent refresh protection: if token was refreshed in the last 30 seconds, skip
  const updatedAt = connection.updatedAt instanceof Date
    ? connection.updatedAt.getTime()
    : new Date(connection.updatedAt).getTime()
  if (Date.now() - updatedAt < RECENT_REFRESH_WINDOW_MS) {
    // Re-read from DB to get the latest token (another process may have refreshed)
    const fresh = await prisma.platformConnection.findUnique({
      where: { id: connection.id },
    })
    return (fresh as PlatformConnectionRow | null) ?? connection
  }

  // Perform refresh based on platform
  let result: TokenRefreshResult

  if (connection.platform === PlatformType.YOUTUBE) {
    result = await refreshYouTubeToken(connection)
  } else if (connection.platform === PlatformType.TWITCH) {
    result = await refreshTwitchToken(connection)
  } else {
    return connection
  }

  if (!result.success) {
    console.error(`[TokenRefresh] ${connection.platform} refresh failed for user ${connection.userId}: ${result.error}`)

    // Publish SSE event if room code is provided
    if (roomCode) {
      await publishEvent(roomCode, {
        type: "PLATFORM_TOKEN_EXPIRED" as const,
        data: {
          platform: connection.platform.toLowerCase(),
          error: result.error ?? "Token refresh failed",
        },
      }).catch((err) => {
        console.error("[TokenRefresh] Failed to publish PLATFORM_TOKEN_EXPIRED event:", err)
      })
    }

    return connection
  }

  // Update the database with the new token
  try {
    const updated = await prisma.platformConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt,
      },
    })
    console.log(`[TokenRefresh] ${connection.platform} token refreshed for user ${connection.userId}`)
    return updated as PlatformConnectionRow
  } catch (err) {
    console.error(`[TokenRefresh] Failed to update DB after ${connection.platform} refresh:`, err)
    // Return the connection with the new token in memory even if DB update failed
    return {
      ...connection,
      accessToken: result.accessToken ?? connection.accessToken,
      refreshToken: result.refreshToken ?? connection.refreshToken,
      expiresAt: result.expiresAt ?? connection.expiresAt,
      updatedAt: new Date(),
    }
  }
}
