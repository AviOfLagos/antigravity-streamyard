import { describe, it, expect, beforeEach } from "vitest"
import { useStudioStore } from "@/store/studio"

describe("StudioStore — Extended Features", () => {
  beforeEach(() => {
    useStudioStore.setState({
      onScreenParticipantIds: [],
      activeLayout: "grid",
      pinnedParticipantId: null,
      pendingGuests: [],
      textOverlays: [],
      stageBackground: "#0d0d0d",
      isLive: false,
      streamEgressId: null,
      streamPlatforms: [],
      streamStartedAt: null,
      isRecording: false,
      recordingEgressId: null,
      recordingStartedAt: null,
      chatOverlayEnabled: false,
      chatOverlayPosition: "bottom-left",
      aiChatEnabled: false,
      aiChatContext: "",
      aiChatDelay: 10,
      aiChatReadAloud: false,
      autoLayoutEnabled: false,
    })
  })

  // ── Text Overlays ──────────────────────────────────────────────────────

  describe("addTextOverlay", () => {
    it("adds an overlay with a generated id", () => {
      useStudioStore.getState().addTextOverlay({
        text: "Hello World",
        position: "bottom",
        fontSize: "md",
        color: "#ffffff",
        bgColor: "#000000cc",
        visible: true,
        expiresAt: null,
      })
      const overlays = useStudioStore.getState().textOverlays
      expect(overlays).toHaveLength(1)
      expect(overlays[0].text).toBe("Hello World")
      expect(overlays[0].id).toBeTruthy()
    })

    it("assigns unique ids to each overlay", () => {
      const store = useStudioStore.getState()
      store.addTextOverlay({ text: "A", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      store.addTextOverlay({ text: "B", position: "bottom", fontSize: "lg", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      const overlays = useStudioStore.getState().textOverlays
      expect(overlays).toHaveLength(2)
      expect(overlays[0].id).not.toBe(overlays[1].id)
    })
  })

  describe("removeTextOverlay", () => {
    it("removes overlay by id", () => {
      useStudioStore.getState().addTextOverlay({ text: "A", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      useStudioStore.getState().addTextOverlay({ text: "B", position: "bottom", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      const id = useStudioStore.getState().textOverlays[0].id
      useStudioStore.getState().removeTextOverlay(id)
      const overlays = useStudioStore.getState().textOverlays
      expect(overlays).toHaveLength(1)
      expect(overlays[0].text).toBe("B")
    })

    it("is idempotent for non-existent id", () => {
      useStudioStore.getState().addTextOverlay({ text: "A", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      useStudioStore.getState().removeTextOverlay("non-existent")
      expect(useStudioStore.getState().textOverlays).toHaveLength(1)
    })
  })

  describe("toggleTextOverlay", () => {
    it("toggles visibility", () => {
      useStudioStore.getState().addTextOverlay({ text: "A", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      const id = useStudioStore.getState().textOverlays[0].id
      useStudioStore.getState().toggleTextOverlay(id)
      expect(useStudioStore.getState().textOverlays[0].visible).toBe(false)
      useStudioStore.getState().toggleTextOverlay(id)
      expect(useStudioStore.getState().textOverlays[0].visible).toBe(true)
    })
  })

  describe("updateTextOverlay", () => {
    it("updates specific fields without affecting others", () => {
      useStudioStore.getState().addTextOverlay({ text: "Original", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      const id = useStudioStore.getState().textOverlays[0].id
      useStudioStore.getState().updateTextOverlay(id, { text: "Updated", fontSize: "lg" })
      const overlay = useStudioStore.getState().textOverlays[0]
      expect(overlay.text).toBe("Updated")
      expect(overlay.fontSize).toBe("lg")
      expect(overlay.position).toBe("top") // unchanged
      expect(overlay.color).toBe("#fff") // unchanged
    })
  })

  describe("text overlay timer (expiresAt)", () => {
    it("stores expiresAt as epoch ms", () => {
      const future = Date.now() + 60000
      useStudioStore.getState().addTextOverlay({ text: "Timed", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: future })
      expect(useStudioStore.getState().textOverlays[0].expiresAt).toBe(future)
    })

    it("stores null expiresAt for permanent overlays", () => {
      useStudioStore.getState().addTextOverlay({ text: "Permanent", position: "top", fontSize: "sm", color: "#fff", bgColor: "#000", visible: true, expiresAt: null })
      expect(useStudioStore.getState().textOverlays[0].expiresAt).toBeNull()
    })
  })

  // ── Stage Background ───────────────────────────────────────────────────

  describe("setStageBackground", () => {
    it("sets background color", () => {
      useStudioStore.getState().setStageBackground("#1a1a2e")
      expect(useStudioStore.getState().stageBackground).toBe("#1a1a2e")
    })

    it("defaults to #0d0d0d", () => {
      expect(useStudioStore.getState().stageBackground).toBe("#0d0d0d")
    })
  })

  // ── Recording State ────────────────────────────────────────────────────

  describe("setRecordingState", () => {
    it("sets recording state with all fields", () => {
      const now = new Date()
      useStudioStore.getState().setRecordingState(true, "rec-1", now)
      const state = useStudioStore.getState()
      expect(state.isRecording).toBe(true)
      expect(state.recordingEgressId).toBe("rec-1")
      expect(state.recordingStartedAt).toBe(now)
    })

    it("resets recording state", () => {
      useStudioStore.getState().setRecordingState(true, "rec-1", new Date())
      useStudioStore.getState().setRecordingState(false)
      const state = useStudioStore.getState()
      expect(state.isRecording).toBe(false)
      expect(state.recordingEgressId).toBeNull()
      expect(state.recordingStartedAt).toBeNull()
    })
  })

  // ── Chat Overlay ───────────────────────────────────────────────────────

  describe("chatOverlay", () => {
    it("defaults to disabled, bottom-left", () => {
      const state = useStudioStore.getState()
      expect(state.chatOverlayEnabled).toBe(false)
      expect(state.chatOverlayPosition).toBe("bottom-left")
    })

    it("toggles enabled state", () => {
      useStudioStore.getState().setChatOverlayEnabled(true)
      expect(useStudioStore.getState().chatOverlayEnabled).toBe(true)
      useStudioStore.getState().setChatOverlayEnabled(false)
      expect(useStudioStore.getState().chatOverlayEnabled).toBe(false)
    })

    it.each(["bottom-left", "bottom-right", "top-left", "top-right"] as const)(
      "sets position to %s",
      (position) => {
        useStudioStore.getState().setChatOverlayPosition(position)
        expect(useStudioStore.getState().chatOverlayPosition).toBe(position)
      }
    )
  })

  // ── AI Chat Assistant ──────────────────────────────────────────────────

  describe("aiChat", () => {
    it("defaults to disabled with sensible defaults", () => {
      const state = useStudioStore.getState()
      expect(state.aiChatEnabled).toBe(false)
      expect(state.aiChatContext).toBe("")
      expect(state.aiChatDelay).toBe(10)
      expect(state.aiChatReadAloud).toBe(false)
    })

    it("sets AI enabled state", () => {
      useStudioStore.getState().setAIChatEnabled(true)
      expect(useStudioStore.getState().aiChatEnabled).toBe(true)
    })

    it("sets AI context", () => {
      useStudioStore.getState().setAIChatContext("Gaming stream about Minecraft")
      expect(useStudioStore.getState().aiChatContext).toBe("Gaming stream about Minecraft")
    })

    it("sets AI delay", () => {
      useStudioStore.getState().setAIChatDelay(5)
      expect(useStudioStore.getState().aiChatDelay).toBe(5)
    })

    it("sets read aloud", () => {
      useStudioStore.getState().setAIChatReadAloud(true)
      expect(useStudioStore.getState().aiChatReadAloud).toBe(true)
    })
  })

  // ── Auto Layout ────────────────────────────────────────────────────────

  describe("autoLayout", () => {
    it("defaults to disabled", () => {
      expect(useStudioStore.getState().autoLayoutEnabled).toBe(false)
    })

    it("enables and disables auto layout", () => {
      useStudioStore.getState().setAutoLayoutEnabled(true)
      expect(useStudioStore.getState().autoLayoutEnabled).toBe(true)
      useStudioStore.getState().setAutoLayoutEnabled(false)
      expect(useStudioStore.getState().autoLayoutEnabled).toBe(false)
    })

    it("manual layout change works while auto is enabled", () => {
      useStudioStore.getState().setAutoLayoutEnabled(true)
      useStudioStore.getState().setLayout("spotlight")
      expect(useStudioStore.getState().activeLayout).toBe("spotlight")
    })
  })
})
