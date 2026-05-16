import { describe, expect, it } from "vitest"

import { formatViewerCount } from "@/lib/viewer-counts"

describe("formatViewerCount", () => {
  it("returns the raw integer below 1k", () => {
    expect(formatViewerCount(0)).toBe("0")
    expect(formatViewerCount(1)).toBe("1")
    expect(formatViewerCount(999)).toBe("999")
  })

  it("formats hundreds-of-thousands with a single decimal when below 10k", () => {
    expect(formatViewerCount(1_000)).toBe("1K")
    expect(formatViewerCount(1_200)).toBe("1.2K")
    expect(formatViewerCount(9_999)).toBe("10K")
  })

  it("rounds to whole K between 10k and 1M", () => {
    expect(formatViewerCount(12_400)).toBe("12K")
    expect(formatViewerCount(99_500)).toBe("100K")
    expect(formatViewerCount(999_000)).toBe("999K")
  })

  it("uses 1-decimal M between 1M and 10M", () => {
    expect(formatViewerCount(1_000_000)).toBe("1M")
    expect(formatViewerCount(1_100_000)).toBe("1.1M")
    expect(formatViewerCount(9_500_000)).toBe("9.5M")
  })

  it("rounds to whole M above 10M", () => {
    expect(formatViewerCount(12_400_000)).toBe("12M")
    expect(formatViewerCount(999_000_000)).toBe("999M")
  })

  it("strips trailing .0 in K and M ranges", () => {
    expect(formatViewerCount(2_000)).toBe("2K")
    expect(formatViewerCount(3_000_000)).toBe("3M")
  })
})
