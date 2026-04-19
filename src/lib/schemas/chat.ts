import { z } from "zod"

import { PlatformSchema } from "./platform"

// ── Chat message author ──────────────────────────────────────────────────────

export const ChatAuthorSchema = z.object({
  name: z.string(),
  avatar: z.string().optional(),
  color: z.string().optional(),
  badges: z.array(z.string()).optional(),
})
export type ChatAuthor = z.infer<typeof ChatAuthorSchema>

// ── Chat message ─────────────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  author: ChatAuthorSchema,
  message: z.string(),
  timestamp: z.string(), // ISO string
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>
