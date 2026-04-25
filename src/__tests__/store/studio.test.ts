import { describe, it, expect, beforeEach } from "vitest"
import { useStudioStore } from "@/store/studio"

describe("StudioStore", () => {
  beforeEach(() => {
    useStudioStore.setState({
      onScreenParticipantIds: [],
      activeLayout: "grid",
      pinnedParticipantId: null,
      pendingGuests: [],
      isLive: false,
      streamEgressId: null,
      streamPlatforms: [],
      streamStartedAt: null,
    })
  })

  // ── Stage management ───────────────────────────────────────────────────

  describe("bringOnStage", () => {
    it("adds participant to on-screen list", () => {
      useStudioStore.getState().bringOnStage("p1")
      expect(useStudioStore.getState().onScreenParticipantIds).toEqual(["p1"])
    })

    it("does not add duplicates", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().bringOnStage("p1")
      expect(useStudioStore.getState().onScreenParticipantIds).toEqual(["p1"])
    })

    it("preserves order with multiple participants", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().bringOnStage("p2")
      useStudioStore.getState().bringOnStage("p3")
      expect(useStudioStore.getState().onScreenParticipantIds).toEqual(["p1", "p2", "p3"])
    })
  })

  describe("sendToBackstage", () => {
    it("removes participant from on-screen list", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().bringOnStage("p2")
      useStudioStore.getState().sendToBackstage("p1")
      expect(useStudioStore.getState().onScreenParticipantIds).toEqual(["p2"])
    })

    it("clears pinned if backstaged participant was pinned", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().setPinned("p1")
      useStudioStore.getState().sendToBackstage("p1")
      expect(useStudioStore.getState().pinnedParticipantId).toBeNull()
    })

    it("preserves pinned if different participant backstaged", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().bringOnStage("p2")
      useStudioStore.getState().setPinned("p2")
      useStudioStore.getState().sendToBackstage("p1")
      expect(useStudioStore.getState().pinnedParticipantId).toBe("p2")
    })

    it("is idempotent for non-existent participant", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().sendToBackstage("p99")
      expect(useStudioStore.getState().onScreenParticipantIds).toEqual(["p1"])
    })
  })

  // ── Layout ──────────────────────────────────────────────────────────────

  describe("setLayout", () => {
    it.each(["grid", "spotlight", "screen-grid", "screen-only", "single"] as const)(
      "sets layout to %s",
      (layout) => {
        useStudioStore.getState().setLayout(layout)
        expect(useStudioStore.getState().activeLayout).toBe(layout)
      }
    )
  })

  describe("setPinned", () => {
    it("sets and clears pinned participant", () => {
      useStudioStore.getState().setPinned("p1")
      expect(useStudioStore.getState().pinnedParticipantId).toBe("p1")
      useStudioStore.getState().setPinned(null)
      expect(useStudioStore.getState().pinnedParticipantId).toBeNull()
    })
  })

  // ── Guest queue ─────────────────────────────────────────────────────────

  describe("addPendingGuest", () => {
    it("adds guest to pending list", () => {
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice" })
      expect(useStudioStore.getState().pendingGuests).toEqual([{ guestId: "g1", name: "Alice" }])
    })

    it("deduplicates by guestId", () => {
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice" })
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice v2" })
      const guests = useStudioStore.getState().pendingGuests
      expect(guests).toHaveLength(1)
      expect(guests[0].name).toBe("Alice v2")
    })
  })

  describe("removePendingGuest", () => {
    it("removes guest by guestId", () => {
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice" })
      useStudioStore.getState().addPendingGuest({ guestId: "g2", name: "Bob" })
      useStudioStore.getState().removePendingGuest("g1")
      expect(useStudioStore.getState().pendingGuests).toEqual([{ guestId: "g2", name: "Bob" }])
    })

    it("is idempotent for non-existent guest", () => {
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice" })
      useStudioStore.getState().removePendingGuest("g99")
      expect(useStudioStore.getState().pendingGuests).toHaveLength(1)
    })
  })

  describe("clearPendingGuests", () => {
    it("clears all pending guests", () => {
      useStudioStore.getState().addPendingGuest({ guestId: "g1", name: "Alice" })
      useStudioStore.getState().addPendingGuest({ guestId: "g2", name: "Bob" })
      useStudioStore.getState().clearPendingGuests()
      expect(useStudioStore.getState().pendingGuests).toEqual([])
    })
  })

  // ── Streaming state ────────────────────────────────────────────────────

  describe("setLiveState", () => {
    it("sets live state with all fields", () => {
      const now = new Date()
      useStudioStore.getState().setLiveState(true, "egress-1", ["youtube", "twitch"], now)
      const state = useStudioStore.getState()
      expect(state.isLive).toBe(true)
      expect(state.streamEgressId).toBe("egress-1")
      expect(state.streamPlatforms).toEqual(["youtube", "twitch"])
      expect(state.streamStartedAt).toBe(now)
    })

    it("resets to offline state", () => {
      useStudioStore.getState().setLiveState(true, "egress-1", ["youtube"], new Date())
      useStudioStore.getState().setLiveState(false)
      const state = useStudioStore.getState()
      expect(state.isLive).toBe(false)
      expect(state.streamEgressId).toBeNull()
      expect(state.streamPlatforms).toEqual([])
      expect(state.streamStartedAt).toBeNull()
    })
  })

  describe("addStreamPlatform / removeStreamPlatform", () => {
    it("adds platform without duplicates", () => {
      useStudioStore.getState().addStreamPlatform("youtube")
      useStudioStore.getState().addStreamPlatform("youtube")
      expect(useStudioStore.getState().streamPlatforms).toEqual(["youtube"])
    })

    it("removes platform", () => {
      useStudioStore.getState().addStreamPlatform("youtube")
      useStudioStore.getState().addStreamPlatform("twitch")
      useStudioStore.getState().removeStreamPlatform("youtube")
      expect(useStudioStore.getState().streamPlatforms).toEqual(["twitch"])
    })
  })

  // ── Hydration ──────────────────────────────────────────────────────────

  describe("hydrateFromSaved", () => {
    it("hydrates partial state without overwriting unset fields", () => {
      useStudioStore.getState().bringOnStage("p1")
      useStudioStore.getState().hydrateFromSaved({ activeLayout: "spotlight" })
      const state = useStudioStore.getState()
      expect(state.activeLayout).toBe("spotlight")
      expect(state.onScreenParticipantIds).toEqual(["p1"]) // preserved
    })

    it("hydrates all fields", () => {
      useStudioStore.getState().hydrateFromSaved({
        activeLayout: "single",
        pinnedParticipantId: "p5",
        onScreenParticipantIds: ["p5", "p6"],
      })
      const state = useStudioStore.getState()
      expect(state.activeLayout).toBe("single")
      expect(state.pinnedParticipantId).toBe("p5")
      expect(state.onScreenParticipantIds).toEqual(["p5", "p6"])
    })
  })
})
