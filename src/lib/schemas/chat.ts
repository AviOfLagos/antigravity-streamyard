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

// ── Event types ──────────────────────────────────────────────────────────────

export const ChatEventTypeSchema = z.enum([
  "text",          // Regular chat message
  "donation",      // Super Chat (YT), Bits (Twitch), Gift (TikTok)
  "subscription",  // New sub, resub, gift sub
  "follow",        // New follower
  "raid",          // Incoming raid (Twitch)
  "like",          // Likes (TikTok)
  "join",          // Viewer joined (TikTok)
  "system",        // System/moderation messages
])
export type ChatEventType = z.infer<typeof ChatEventTypeSchema>

// ── Donation metadata ────────────────────────────────────────────────────────

export const DonationDataSchema = z.object({
  amount: z.number(),             // Numeric value (e.g. 5.00, 100 bits, 50 diamonds)
  currency: z.string().optional(), // "USD", "bits", "diamonds", etc.
  formattedAmount: z.string(),    // Pre-formatted display string (e.g. "$5.00", "100 Bits")
  tier: z.number().optional(),    // Super Chat tier (YT), sub tier (Twitch)
})
export type DonationData = z.infer<typeof DonationDataSchema>

// ── Subscription metadata ────────────────────────────────────────────────────

export const SubscriptionDataSchema = z.object({
  tier: z.string().optional(),         // "Tier 1", "Tier 2", "Tier 3"
  months: z.number().optional(),       // Cumulative months
  isGift: z.boolean().optional(),      // Whether it was gifted
  gifterName: z.string().optional(),   // Who gifted it
  giftCount: z.number().optional(),    // Number of gifts in batch
})
export type SubscriptionData = z.infer<typeof SubscriptionDataSchema>

// ── Raid metadata ────────────────────────────────────────────────────────────

export const RaidDataSchema = z.object({
  viewerCount: z.number(),
  raiderName: z.string(),
})
export type RaidData = z.infer<typeof RaidDataSchema>

// ── Chat message (expanded) ──────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  author: ChatAuthorSchema,
  message: z.string(),
  timestamp: z.string(), // ISO string
  // New enriched fields — all optional for backward compatibility
  eventType: ChatEventTypeSchema.optional(), // defaults to "text" if absent
  donation: DonationDataSchema.optional(),
  subscription: SubscriptionDataSchema.optional(),
  raid: RaidDataSchema.optional(),
  replyTo: z.object({
    messageId: z.string(),
    authorName: z.string(),
  }).optional(),
  likeCount: z.number().optional(),
})
export type ChatMessage = z.infer<typeof ChatMessageSchema>
