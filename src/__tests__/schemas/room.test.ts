import { describe, it, expect } from "vitest"
import {
  RoomCodeSchema,
  CreateRoomRequestSchema,
  CreateRoomResponseSchema,
} from "@/lib/schemas/room"

describe("RoomCodeSchema", () => {
  it("accepts valid 6-char code", () => {
    expect(RoomCodeSchema.safeParse("abc123").success).toBe(true)
  })

  it("accepts valid 8-char code", () => {
    expect(RoomCodeSchema.safeParse("abcd1234").success).toBe(true)
  })

  it("rejects too short", () => {
    expect(RoomCodeSchema.safeParse("abc").success).toBe(false)
  })

  it("rejects too long", () => {
    expect(RoomCodeSchema.safeParse("abcdefghi").success).toBe(false)
  })

  it("rejects special characters", () => {
    expect(RoomCodeSchema.safeParse("abc-12").success).toBe(false)
    expect(RoomCodeSchema.safeParse("abc 12").success).toBe(false)
  })
})

describe("CreateRoomRequestSchema", () => {
  it("accepts minimal request", () => {
    const result = CreateRoomRequestSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.selectedPlatforms).toEqual([])
      expect(result.data.autoAdmit).toBe(false)
    }
  })

  it("accepts title and platforms", () => {
    const result = CreateRoomRequestSchema.safeParse({
      title: "My Stream",
      selectedPlatforms: ["youtube", "twitch"],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.title).toBe("My Stream")
      expect(result.data.selectedPlatforms).toEqual(["youtube", "twitch"])
    }
  })

  it("accepts autoAdmit flag", () => {
    const result = CreateRoomRequestSchema.safeParse({ autoAdmit: true })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.autoAdmit).toBe(true)
  })

  it("strips HTML from title", () => {
    const result = CreateRoomRequestSchema.safeParse({ title: "<script>alert(1)</script>Stream" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title).not.toContain("<script>")
  })

  it("limits title to 100 chars", () => {
    const result = CreateRoomRequestSchema.safeParse({ title: "A".repeat(200) })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.title!.length).toBeLessThanOrEqual(100)
  })

  it("rejects invalid platform", () => {
    const result = CreateRoomRequestSchema.safeParse({ selectedPlatforms: ["invalid"] })
    expect(result.success).toBe(false)
  })
})

describe("CreateRoomResponseSchema", () => {
  it("accepts valid response", () => {
    const result = CreateRoomResponseSchema.safeParse({ code: "abc123", hostToken: "token" })
    expect(result.success).toBe(true)
  })

  it("rejects missing fields", () => {
    expect(CreateRoomResponseSchema.safeParse({ code: "abc123" }).success).toBe(false)
    expect(CreateRoomResponseSchema.safeParse({ hostToken: "token" }).success).toBe(false)
  })
})
