import { RoomStatus as PrismaRoomStatus } from "@prisma/client"
import { z } from "zod"

import { stripHtml } from "@/lib/sanitize"
import { PlatformSchema } from "./platform"

// ── Room code validation ────────────────────────────────────────────────────

export const RoomCodeSchema = z
  .string()
  .regex(/^[a-zA-Z0-9]{6,8}$/, "Room code must be 6-8 alphanumeric characters")

// ── Room creation request (POST /api/rooms) ──────────────────────────────────

export const CreateRoomRequestSchema = z.object({
  title: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return val
      return stripHtml(val).trim().slice(0, 100) || undefined
    }),
  description: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return val
      return stripHtml(val).trim().slice(0, 2000) || undefined
    }),
  thumbnailUrl: z
    .string()
    .url("Thumbnail URL must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
  selectedPlatforms: z.array(PlatformSchema).optional().default([]),
  autoAdmit: z.boolean().optional().default(false),
})
export type CreateRoomRequest = z.infer<typeof CreateRoomRequestSchema>

// ── Room creation response ───────────────────────────────────────────────────

export const CreateRoomResponseSchema = z.object({
  code: z.string(),
  hostToken: z.string(),
})
export type CreateRoomResponse = z.infer<typeof CreateRoomResponseSchema>

// ── Room status ──────────────────────────────────────────────────────────────

export const RoomStatusSchema = z.nativeEnum(PrismaRoomStatus)
export type RoomStatus = z.infer<typeof RoomStatusSchema>

// ── Room info (as stored in Redis) ───────────────────────────────────────────

export const RoomInfoSchema = z.object({
  hostId: z.string(),
  createdAt: z.number(),
  title: z.string().nullable(),
})
export type RoomInfo = z.infer<typeof RoomInfoSchema>

// ── Generic OK response (used by admit, deny, end, leave, chat/connect) ─────

export const OkResponseSchema = z.object({
  ok: z.literal(true),
})
export type OkResponse = z.infer<typeof OkResponseSchema>

// ── Chat connect response ────────────────────────────────────────────────────

export const ChatConnectResponseSchema = z.object({
  ok: z.literal(true),
  platforms: z.array(PlatformSchema),
})
export type ChatConnectResponse = z.infer<typeof ChatConnectResponseSchema>
