import { describe, it, expect } from "vitest"
import {
  GuestRequestSchema,
  GuestRequestResponseSchema,
  AdmitGuestRequestSchema,
  DenyGuestRequestSchema,
  LeaveRequestSchema,
} from "@/lib/schemas/guest"

describe("GuestRequestSchema", () => {
  it("accepts valid name", () => {
    const result = GuestRequestSchema.safeParse({ name: "Alice" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe("Alice")
  })

  it("trims and limits name to 50 chars", () => {
    const longName = "A".repeat(100)
    const result = GuestRequestSchema.safeParse({ name: longName })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name.length).toBeLessThanOrEqual(50)
  })

  it("strips HTML from name", () => {
    const result = GuestRequestSchema.safeParse({ name: "<b>Alice</b>" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe("Alice")
  })

  it("rejects empty name", () => {
    expect(GuestRequestSchema.safeParse({ name: "" }).success).toBe(false)
  })

  it("rejects missing name", () => {
    expect(GuestRequestSchema.safeParse({}).success).toBe(false)
  })

  it("accepts valid email", () => {
    const result = GuestRequestSchema.safeParse({ name: "Alice", email: "alice@example.com" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe("alice@example.com")
  })

  it("normalizes email to lowercase", () => {
    const result = GuestRequestSchema.safeParse({ name: "Alice", email: "Alice@Example.COM" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe("alice@example.com")
  })

  it("rejects invalid email", () => {
    const result = GuestRequestSchema.safeParse({ name: "Alice", email: "not-an-email" })
    expect(result.success).toBe(false)
  })

  it("allows missing email", () => {
    const result = GuestRequestSchema.safeParse({ name: "Alice" })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeUndefined()
  })
})

describe("GuestRequestResponseSchema", () => {
  it("accepts guestId", () => {
    const result = GuestRequestResponseSchema.safeParse({ guestId: "abc-123" })
    expect(result.success).toBe(true)
  })

  it("accepts autoAdmitted flag", () => {
    const result = GuestRequestResponseSchema.safeParse({ guestId: "abc", autoAdmitted: true })
    expect(result.success).toBe(true)
  })
})

describe("AdmitGuestRequestSchema", () => {
  it("accepts guestId with optional name", () => {
    expect(AdmitGuestRequestSchema.safeParse({ guestId: "g1" }).success).toBe(true)
    expect(AdmitGuestRequestSchema.safeParse({ guestId: "g1", name: "Alice" }).success).toBe(true)
  })

  it("rejects empty guestId", () => {
    expect(AdmitGuestRequestSchema.safeParse({ guestId: "" }).success).toBe(false)
  })
})

describe("DenyGuestRequestSchema", () => {
  it("accepts guestId", () => {
    expect(DenyGuestRequestSchema.safeParse({ guestId: "g1" }).success).toBe(true)
  })

  it("rejects empty guestId", () => {
    expect(DenyGuestRequestSchema.safeParse({ guestId: "" }).success).toBe(false)
  })
})

describe("LeaveRequestSchema", () => {
  it("accepts displayName and identity", () => {
    const result = LeaveRequestSchema.safeParse({ displayName: "Alice", identity: "guest-123" })
    expect(result.success).toBe(true)
  })

  it("accepts empty object (all optional)", () => {
    expect(LeaveRequestSchema.safeParse({}).success).toBe(true)
  })
})
