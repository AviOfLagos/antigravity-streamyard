import { describe, it, expect } from "vitest"
import { SSEEventDataSchema } from "@/lib/schemas/sse"

describe("SSEEventDataSchema", () => {
  it("parses GUEST_REQUEST", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_REQUEST",
      data: { guestId: "g1", name: "Alice" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_ADMITTED with optional identity/name", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_ADMITTED",
      data: { guestId: "g1", token: "tok", identity: "guest-g1", name: "Alice" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_ADMITTED without optional fields", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_ADMITTED",
      data: { guestId: "g1", token: "tok" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_DENIED", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_DENIED",
      data: { guestId: "g1" },
    })
    expect(result.success).toBe(true)
  })

  it("parses GUEST_LEFT", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "GUEST_LEFT",
      data: { participantId: "guest-123" },
    })
    expect(result.success).toBe(true)
  })

  it("parses STUDIO_ENDED", () => {
    expect(SSEEventDataSchema.safeParse({ type: "STUDIO_ENDED" }).success).toBe(true)
  })

  it("parses PING", () => {
    expect(SSEEventDataSchema.safeParse({ type: "PING" }).success).toBe(true)
  })

  it("parses CONNECTION_ERROR", () => {
    expect(SSEEventDataSchema.safeParse({ type: "CONNECTION_ERROR" }).success).toBe(true)
  })

  it("parses CHAT_MESSAGE", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "CHAT_MESSAGE",
      data: {
        id: "msg-1",
        platform: "twitch",
        author: { name: "Viewer" },
        message: "Hello!",
        timestamp: "2026-04-24T12:00:00Z",
      },
    })
    expect(result.success).toBe(true)
  })

  it("parses STREAM_STARTED", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "STREAM_STARTED",
      data: { platforms: ["youtube"], egressId: "egr-1" },
    })
    expect(result.success).toBe(true)
  })

  it("parses STREAM_STOPPED", () => {
    expect(SSEEventDataSchema.safeParse({ type: "STREAM_STOPPED" }).success).toBe(true)
  })

  it("parses STREAM_DESTINATION_CHANGED", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "STREAM_DESTINATION_CHANGED",
      data: { action: "add", platform: "twitch" },
    })
    expect(result.success).toBe(true)
  })

  it("parses STREAM_ERROR", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "STREAM_ERROR",
      data: { error: "Connection failed", platform: "youtube" },
    })
    expect(result.success).toBe(true)
  })

  it("parses CHAT_CONNECTOR_STATUS", () => {
    const result = SSEEventDataSchema.safeParse({
      type: "CHAT_CONNECTOR_STATUS",
      data: { platform: "twitch", status: "connected" },
    })
    expect(result.success).toBe(true)
  })

  it("rejects unknown event type", () => {
    expect(SSEEventDataSchema.safeParse({ type: "UNKNOWN_EVENT" }).success).toBe(false)
  })
})
