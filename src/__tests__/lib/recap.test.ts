import { describe, expect, it } from "vitest"

import { formatRecapDuration } from "@/lib/recap"

describe("formatRecapDuration", () => {
  it("renders sub-minute durations in seconds", () => {
    expect(formatRecapDuration(0)).toBe("0s")
    expect(formatRecapDuration(1)).toBe("1s")
    expect(formatRecapDuration(59)).toBe("59s")
  })

  it("rounds down to whole minutes for sub-hour durations", () => {
    expect(formatRecapDuration(60)).toBe("1 min")
    expect(formatRecapDuration(125)).toBe("2 min") // 2m 5s → drop the seconds
    expect(formatRecapDuration(3599)).toBe("59 min")
  })

  it("uses h+m formatting once we cross an hour", () => {
    expect(formatRecapDuration(3600)).toBe("1h 0m")
    expect(formatRecapDuration(3660)).toBe("1h 1m")
    expect(formatRecapDuration(7325)).toBe("2h 2m") // 2h 2m 5s → drop seconds
  })

  it("handles multi-hour streams without losing the minute component", () => {
    expect(formatRecapDuration(36_000)).toBe("10h 0m")
    expect(formatRecapDuration(36_660)).toBe("10h 11m")
  })
})
