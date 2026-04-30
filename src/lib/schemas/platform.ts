import { z } from "zod"

// ── Platform enum (lowercase — canonical form used by client & chat system) ──

export const PlatformSchema = z.enum(["youtube", "twitch", "kick", "tiktok", "host", "guest", "ai"])
export type Platform = z.infer<typeof PlatformSchema>

// Accepts both lowercase and uppercase (DB returns uppercase PlatformType enum)
// and normalizes to lowercase for client consumption.
export const PlatformFlexSchema = z
  .string()
  .transform((v) => v.toLowerCase() as Platform)
  .pipe(PlatformSchema)

// Schema for external platform connections (excludes "host" which is internal-only)
export const ExternalPlatformSchema = z.enum(["youtube", "twitch", "kick", "tiktok"])

// ── Platform connection (as returned by GET /api/platforms) ──────────────────

export const PlatformConnectionSchema = z.object({
  platform: PlatformFlexSchema,
  channelName: z.string(),
})
export type PlatformConnection = z.infer<typeof PlatformConnectionSchema>

// ── Platform connect request (POST /api/platforms/connect) ───────────────────

export const PlatformConnectRequestSchema = z.object({
  platform: ExternalPlatformSchema,
  channelName: z.string().min(1),
  channelId: z.string().optional(),
})
export type PlatformConnectRequest = z.infer<typeof PlatformConnectRequestSchema>

// ── Platform disconnect request (DELETE /api/platforms/disconnect) ────────────

export const PlatformDisconnectRequestSchema = z.object({
  platform: ExternalPlatformSchema,
})
export type PlatformDisconnectRequest = z.infer<typeof PlatformDisconnectRequestSchema>

// ── Stream key request (PUT /api/platforms/stream-key) ──────────────────────

export const StreamKeyRequestSchema = z.object({
  platform: ExternalPlatformSchema,
  streamKey: z.string().min(1),
  ingestUrl: z.string().optional(),
  backupIngestUrl: z.string().optional(),
})
export type StreamKeyRequest = z.infer<typeof StreamKeyRequestSchema>

// ── Platform list response ───────────────────────────────────────────────────

export const PlatformListResponseSchema = z.object({
  platforms: z.array(PlatformConnectionSchema),
})
export type PlatformListResponse = z.infer<typeof PlatformListResponseSchema>
