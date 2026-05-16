import { PlatformType } from "@prisma/client"
import { describe, expect, it } from "vitest"

import { buildRtmpUrl, inferPlatformFromUrl } from "@/lib/egress"

describe("inferPlatformFromUrl", () => {
  it("recognises YouTube primary + backup ingest", () => {
    expect(inferPlatformFromUrl("rtmp://a.rtmp.youtube.com/live2/abc")).toBe("youtube")
    expect(inferPlatformFromUrl("rtmp://b.rtmp.youtube.com/live2/abc")).toBe("youtube")
  })

  it("recognises Twitch", () => {
    expect(inferPlatformFromUrl("rtmp://live.twitch.tv/app/abc")).toBe("twitch")
  })

  it("recognises Kick", () => {
    expect(inferPlatformFromUrl("rtmp://live.kick.com/app/abc")).toBe("kick")
  })

  it("recognises TikTok via tiktok / tiktokcdn", () => {
    expect(inferPlatformFromUrl("rtmp://ingest.tiktokcdn.com/live/abc")).toBe("tiktok")
    expect(inferPlatformFromUrl("rtmp://live.tiktok.com/stream/abc")).toBe("tiktok")
  })

  it("recognises X (Twitter) via pscp.tv / x.com / twitter.com", () => {
    expect(inferPlatformFromUrl("rtmp://va.pscp.tv:80/x/abc")).toBe("twitter")
    expect(inferPlatformFromUrl("rtmp://live-video-cdn-source-aws.x.com/abc")).toBe("twitter")
    expect(inferPlatformFromUrl("rtmp://something.twitter.com/abc")).toBe("twitter")
  })

  it("is case-insensitive", () => {
    expect(inferPlatformFromUrl("RTMP://A.RTMP.YOUTUBE.COM/LIVE2/ABC")).toBe("youtube")
  })

  it("returns null for custom RTMP destinations", () => {
    expect(inferPlatformFromUrl("rtmp://my-server.example.com/live/abc")).toBeNull()
    expect(inferPlatformFromUrl("")).toBeNull()
  })
})

describe("buildRtmpUrl", () => {
  it("uses the well-known base URL for YouTube + Twitch + Kick", () => {
    expect(buildRtmpUrl(PlatformType.YOUTUBE, "key123")).toBe(
      "rtmp://a.rtmp.youtube.com/live2/key123",
    )
    expect(buildRtmpUrl(PlatformType.TWITCH, "key123")).toBe("rtmp://live.twitch.tv/app/key123")
    expect(buildRtmpUrl(PlatformType.KICK, "key123")).toBe("rtmp://live.kick.com/app/key123")
  })

  it("requires an ingest URL for TikTok", () => {
    expect(() => buildRtmpUrl(PlatformType.TIKTOK, "key123")).toThrow(/TikTok requires a custom/)
    expect(buildRtmpUrl(PlatformType.TIKTOK, "key123", "rtmp://push.tiktok.com/live")).toBe(
      "rtmp://push.tiktok.com/live/key123",
    )
  })

  it("requires an ingest URL for Twitter and strips a trailing slash", () => {
    expect(() => buildRtmpUrl(PlatformType.TWITTER, "key123")).toThrow(
      /Twitter \(X\) requires a custom ingest URL/,
    )
    expect(
      buildRtmpUrl(PlatformType.TWITTER, "key123", "rtmp://live-video-cdn-source-aws.x.com/source"),
    ).toBe("rtmp://live-video-cdn-source-aws.x.com/source/key123")
    expect(
      buildRtmpUrl(PlatformType.TWITTER, "key123", "rtmp://live-video-cdn-source-aws.x.com/source/"),
    ).toBe("rtmp://live-video-cdn-source-aws.x.com/source/key123")
  })
})
