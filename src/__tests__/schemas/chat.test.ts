import { describe, it, expect } from "vitest"
import { ChatMessageSchema, ChatAuthorSchema, ChatEventTypeSchema, DonationDataSchema, SubscriptionDataSchema, RaidDataSchema } from "@/lib/schemas/chat"

describe("ChatAuthorSchema", () => {
  it("accepts name only", () => {
    expect(ChatAuthorSchema.safeParse({ name: "Alice" }).success).toBe(true)
  })

  it("accepts all optional fields", () => {
    const result = ChatAuthorSchema.safeParse({
      name: "Alice",
      avatar: "https://example.com/avatar.png",
      color: "#ff0000",
      badges: ["moderator", "subscriber"],
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing name", () => {
    expect(ChatAuthorSchema.safeParse({}).success).toBe(false)
  })
})

describe("ChatEventTypeSchema", () => {
  it.each(["text", "donation", "subscription", "follow", "raid", "like", "join", "system"])(
    "accepts %s",
    (type) => {
      expect(ChatEventTypeSchema.safeParse(type).success).toBe(true)
    }
  )

  it("rejects invalid type", () => {
    expect(ChatEventTypeSchema.safeParse("unknown").success).toBe(false)
  })
})

describe("DonationDataSchema", () => {
  it("accepts valid donation", () => {
    const result = DonationDataSchema.safeParse({
      amount: 5.0,
      currency: "USD",
      formattedAmount: "$5.00",
      tier: 2,
    })
    expect(result.success).toBe(true)
  })

  it("accepts donation without optional fields", () => {
    const result = DonationDataSchema.safeParse({
      amount: 100,
      formattedAmount: "100 Bits",
    })
    expect(result.success).toBe(true)
  })
})

describe("SubscriptionDataSchema", () => {
  it("accepts subscription with all fields", () => {
    const result = SubscriptionDataSchema.safeParse({
      tier: "Tier 1",
      months: 12,
      isGift: true,
      gifterName: "Alice",
      giftCount: 5,
    })
    expect(result.success).toBe(true)
  })

  it("accepts minimal subscription", () => {
    expect(SubscriptionDataSchema.safeParse({}).success).toBe(true)
  })
})

describe("RaidDataSchema", () => {
  it("accepts valid raid", () => {
    const result = RaidDataSchema.safeParse({
      viewerCount: 150,
      raiderName: "StreamerX",
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing fields", () => {
    expect(RaidDataSchema.safeParse({ viewerCount: 50 }).success).toBe(false)
    expect(RaidDataSchema.safeParse({ raiderName: "X" }).success).toBe(false)
  })
})

describe("ChatMessageSchema", () => {
  const baseMessage = {
    id: "msg-1",
    platform: "youtube",
    author: { name: "Alice" },
    message: "Hello!",
    timestamp: "2026-04-24T12:00:00Z",
  }

  it("accepts basic text message (backward compatible)", () => {
    expect(ChatMessageSchema.safeParse(baseMessage).success).toBe(true)
  })

  it.each(["youtube", "twitch", "kick", "tiktok"])("accepts platform %s", (platform) => {
    expect(ChatMessageSchema.safeParse({ ...baseMessage, platform }).success).toBe(true)
  })

  it("rejects invalid platform", () => {
    expect(ChatMessageSchema.safeParse({ ...baseMessage, platform: "facebook" }).success).toBe(false)
  })

  it("accepts message with eventType", () => {
    const result = ChatMessageSchema.safeParse({ ...baseMessage, eventType: "donation" })
    expect(result.success).toBe(true)
  })

  it("accepts donation message", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      eventType: "donation",
      donation: {
        amount: 5.0,
        currency: "USD",
        formattedAmount: "$5.00",
        tier: 1,
      },
    })
    expect(result.success).toBe(true)
  })

  it("accepts subscription message", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      eventType: "subscription",
      subscription: {
        tier: "Tier 1",
        months: 6,
        isGift: false,
      },
    })
    expect(result.success).toBe(true)
  })

  it("accepts raid message", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      platform: "twitch",
      eventType: "raid",
      raid: { viewerCount: 200, raiderName: "BigStreamer" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts message with replyTo", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      platform: "twitch",
      replyTo: { messageId: "parent-123", authorName: "Bob" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts like event with likeCount", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      platform: "tiktok",
      eventType: "like",
      likeCount: 5,
    })
    expect(result.success).toBe(true)
  })

  it("accepts follow event", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      eventType: "follow",
    })
    expect(result.success).toBe(true)
  })

  it("accepts TikTok gift (donation) with diamonds", () => {
    const result = ChatMessageSchema.safeParse({
      ...baseMessage,
      platform: "tiktok",
      eventType: "donation",
      donation: {
        amount: 50,
        currency: "diamonds",
        formattedAmount: "Rose ($0.25)",
      },
    })
    expect(result.success).toBe(true)
  })
})
