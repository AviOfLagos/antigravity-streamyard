import { describe, it, expect } from "vitest"
import { SSEEventDataSchema } from "@/lib/schemas/sse"

describe("SSEEventDataSchema — Extended Events", () => {
  // ── GUEST_LEFT with reason ───────────────────────────────────────────

  it("parses GUEST_LEFT with kicked reason", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_LEFT",
      data: { participantId: "guest-123", name: "Alice", reason: "kicked" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_LEFT with left reason", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_LEFT",
      data: { participantId: "guest-123", name: "Bob", reason: "left" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_LEFT without reason (backward compat)", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_LEFT",
      data: { participantId: "guest-123" },
    })
    expect(result.success).toBe(true)
  })

  // ── CHAT_MESSAGE with new platforms ──────────────────────────────────

  it("parses CHAT_MESSAGE with host platform", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "CHAT_MESSAGE",
      data: {
        id: "msg-host-1",
        platform: "host",
        author: { name: "You" },
        message: "Welcome everyone!",
        timestamp: "2026-04-30T12:00:00Z",
      },
    })
    expect(result.success).toBe(true)
  })

  it("parses CHAT_MESSAGE with guest platform", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "CHAT_MESSAGE",
      data: {
        id: "msg-guest-1",
        platform: "guest",
        author: { name: "Guest User" },
        message: "Thanks for having me!",
        timestamp: "2026-04-30T12:00:00Z",
      },
    })
    expect(result.success).toBe(true)
  })

  it("parses CHAT_MESSAGE with ai platform", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "CHAT_MESSAGE",
      data: {
        id: "msg-ai-1",
        platform: "ai",
        author: { name: "AI Assistant" },
        message: "Great question! The answer is...",
        timestamp: "2026-04-30T12:00:00Z",
      },
    })
    expect(result.success).toBe(true)
  })

  // ── All standard event types still work ─────────────────────────────

  it.each([
    { type: "STUDIO_ENDED" },
    { type: "PING" },
    { type: "CONNECTION_ERROR" },
    { type: "STREAM_STOPPED" },
  ])("parses $type without data", (event) => {
    expect(SSEEventDataSchema.safeParse(event).success).toBe(true)
  })

  it("parses STREAM_STARTED with platforms", () => {
    expect(
      SSEEventDataSchema.safeParse({
        type: "STREAM_STARTED",
        data: { platforms: ["youtube", "twitch"], egressId: "egr-1" },
      }).success
    ).toBe(true)
  })

  it("still rejects unknown event types", () => {
    expect(SSEEventDataSchema.safeParse({ type: "INVALID_TYPE" }).success).toBe(false)
  })
})
