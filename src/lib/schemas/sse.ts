import { z } from "zod"

import { ChatMessageSchema } from "./chat"

// ── SSE event discriminated union ────────────────────────────────────────────

export const SSEChatMessageEventSchema = z.object({
  type: z.literal("CHAT_MESSAGE"),
  data: ChatMessageSchema,
})

export const SSEGuestRequestEventSchema = z.object({
  type: z.literal("GUEST_REQUEST"),
  data: z.object({
    guestId: z.string(),
    name: z.string(),
  }),
})

export const SSEGuestAdmittedEventSchema = z.object({
  type: z.literal("GUEST_ADMITTED"),
  data: z.object({
    guestId: z.string(),
    token: z.string(),
  }),
})

export const SSEGuestDeniedEventSchema = z.object({
  type: z.literal("GUEST_DENIED"),
  data: z.object({
    guestId: z.string(),
  }),
})

export const SSEGuestLeftEventSchema = z.object({
  type: z.literal("GUEST_LEFT"),
  data: z.object({
    participantId: z.string(),
  }),
})

export const SSEStudioEndedEventSchema = z.object({
  type: z.literal("STUDIO_ENDED"),
})

export const SSEPingEventSchema = z.object({
  type: z.literal("PING"),
})

export const SSEConnectionErrorEventSchema = z.object({
  type: z.literal("CONNECTION_ERROR"),
})

export const SSEEventDataSchema = z.discriminatedUnion("type", [
  SSEChatMessageEventSchema,
  SSEGuestRequestEventSchema,
  SSEGuestAdmittedEventSchema,
  SSEGuestDeniedEventSchema,
  SSEGuestLeftEventSchema,
  SSEStudioEndedEventSchema,
  SSEPingEventSchema,
  SSEConnectionErrorEventSchema,
])
export type SSEEventData = z.infer<typeof SSEEventDataSchema>
