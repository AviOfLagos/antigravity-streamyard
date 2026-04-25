import { describe, it, expect } from "vitest"
import { ChatMessageSchema, ChatAuthorSchema } from "@/lib/schemas/chat"

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

describe("ChatMessageSchema", () => {
  const validMessage = {
    id: "msg-1",
    platform: "youtube",
    author: { name: "Alice" },
    message: "Hello!",
    timestamp: "2026-04-24T12:00:00Z",
  }

  it("accepts valid message", () => {
    expect(ChatMessageSchema.safeParse(validMessage).success).toBe(true)
  })

  it.each(["youtube", "twitch", "kick", "tiktok"])("accepts platform %s", (platform) => {
    expect(ChatMessageSchema.safeParse({ ...validMessage, platform }).success).toBe(true)
  })

  it("rejects invalid platform", () => {
    expect(ChatMessageSchema.safeParse({ ...validMessage, platform: "facebook" }).success).toBe(false)
  })

  it("rejects missing id", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...noId } = validMessage
    expect(ChatMessageSchema.safeParse(noId).success).toBe(false)
  })

  it("rejects missing message", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message: _msg, ...noMsg } = validMessage
    expect(ChatMessageSchema.safeParse(noMsg).success).toBe(false)
  })

  it("rejects missing timestamp", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp: _ts, ...noTs } = validMessage
    expect(ChatMessageSchema.safeParse(noTs).success).toBe(false)
  })
})
