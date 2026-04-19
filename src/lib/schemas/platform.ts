import { z } from "zod"

// ── Platform enum (lowercase — canonical form used by client & chat system) ──

export const PlatformSchema = z.enum(["youtube", "twitch", "kick", "tiktok"])
export type Platform = z.infer<typeof PlatformSchema>

// Accepts both lowercase and uppercase (DB returns uppercase PlatformType enum)
// and normalizes to lowercase for client consumption.
const PLATFORM_VALUES = ["youtube", "twitch", "kick", "tiktok"] as const
type PlatformLower = (typeof PLATFORM_VALUES)[number]
export const PlatformFlexSchema = z
  .string()
  .transform((v) => v.toLowerCase() as PlatformLower)
  .pipe(PlatformSchema)

// ── Platform connection (as returned by GET /api/platforms) ──────────────────

export const PlatformConnectionSchema = z.object({
  platform: PlatformFlexSchema,
  channelName: z.string(),
})
export type PlatformConnection = z.infer<typeof PlatformConnectionSchema>

// ── Platform connect request (POST /api/platforms/connect) ───────────────────

export const PlatformConnectRequestSchema = z.object({
  platform: PlatformSchema,
  channelName: z.string().min(1),
  channelId: z.string().optional(),
})
export type PlatformConnectRequest = z.infer<typeof PlatformConnectRequestSchema>

// ── Platform disconnect request (DELETE /api/platforms/disconnect) ────────────

export const PlatformDisconnectRequestSchema = z.object({
  platform: PlatformSchema,
})
export type PlatformDisconnectRequest = z.infer<typeof PlatformDisconnectRequestSchema>

// ── Stream key request (PUT /api/platforms/stream-key) ──────────────────────

export const StreamKeyRequestSchema = z.object({
  platform: PlatformSchema,
  streamKey: z.string().min(1),
  ingestUrl: z.string().optional(),
})
export type StreamKeyRequest = z.infer<typeof StreamKeyRequestSchema>

// ── Platform list response ───────────────────────────────────────────────────

export const PlatformListResponseSchema = z.object({
  platforms: z.array(PlatformConnectionSchema),
})
export type PlatformListResponse = z.infer<typeof PlatformListResponseSchema>
