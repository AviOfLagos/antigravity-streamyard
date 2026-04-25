import { describe, it, expect } from "vitest"
import {
  PlatformSchema,
  PlatformFlexSchema,
  PlatformConnectRequestSchema,
  StreamKeyRequestSchema,
} from "@/lib/schemas/platform"

describe("PlatformSchema", () => {
  it.each(["youtube", "twitch", "kick", "tiktok"])("accepts %s", (platform) => {
    expect(PlatformSchema.safeParse(platform).success).toBe(true)
  })

  it("rejects invalid platform", () => {
    expect(PlatformSchema.safeParse("facebook").success).toBe(false)
    expect(PlatformSchema.safeParse("").success).toBe(false)
  })
})

describe("PlatformFlexSchema", () => {
  it("normalizes uppercase to lowercase", () => {
    const result = PlatformFlexSchema.safeParse("YOUTUBE")
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe("youtube")
  })

  it("normalizes mixed case", () => {
    const result = PlatformFlexSchema.safeParse("Twitch")
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe("twitch")
  })

  it("rejects invalid platform even after normalization", () => {
    expect(PlatformFlexSchema.safeParse("FACEBOOK").success).toBe(false)
  })
})

describe("PlatformConnectRequestSchema", () => {
  it("accepts valid connect request", () => {
    const result = PlatformConnectRequestSchema.safeParse({
      platform: "youtube",
      channelName: "MyChannel",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty channelName", () => {
    const result = PlatformConnectRequestSchema.safeParse({
      platform: "youtube",
      channelName: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("StreamKeyRequestSchema", () => {
  it("accepts streamKey with optional ingestUrl", () => {
    const result = StreamKeyRequestSchema.safeParse({
      platform: "kick",
      streamKey: "live_abc123",
    })
    expect(result.success).toBe(true)
  })

  it("accepts streamKey with ingestUrl", () => {
    const result = StreamKeyRequestSchema.safeParse({
      platform: "tiktok",
      streamKey: "live_abc123",
      ingestUrl: "rtmp://ingest.tiktok.com/live/",
    })
    expect(result.success).toBe(true)
  })

  it("rejects empty streamKey", () => {
    expect(StreamKeyRequestSchema.safeParse({ platform: "kick", streamKey: "" }).success).toBe(false)
  })
})
