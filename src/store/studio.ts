import { create } from "zustand"
import { LAYOUT_PRESETS } from "@/lib/layout/presets"
import type { LayoutPresetId } from "@/lib/layout/types"

interface PendingGuest {
  guestId: string
  name: string
}

export type StudioLayout = LayoutPresetId
export type ChatOverlayPosition = "bottom-left" | "bottom-right" | "top-left" | "top-right"

export interface TextOverlay {
  id: string
  text: string
  position: "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  fontSize: "sm" | "md" | "lg"
  color: string       // hex color, default "#ffffff"
  bgColor: string     // hex color with opacity, default "#000000cc"
  visible: boolean
  expiresAt: number | null  // ms epoch; null = permanent
}

interface StudioStore {
  // Explicit list of on-stage participant identities (empty = show all)
  onScreenParticipantIds: string[]
  // Active layout preset
  activeLayout: StudioLayout
  // Pinned participant (used in spotlight / single)
  pinnedParticipantId: string | null
  // Pending guest requests
  pendingGuests: PendingGuest[]

  // Text overlays
  textOverlays: TextOverlay[]
  // Stage background color
  stageBackground: string

  // Streaming state
  isLive: boolean
  streamEgressId: string | null
  streamPlatforms: string[]
  streamStartedAt: Date | null

  // Recording state
  isRecording: boolean
  recordingEgressId: string | null
  recordingStartedAt: Date | null

  // Chat overlay
  chatOverlayEnabled: boolean
  chatOverlayPosition: ChatOverlayPosition

  // AI chat assistant
  aiChatEnabled: boolean
  aiChatContext: string
  aiChatDelay: number
  aiChatReadAloud: boolean
  setAIChatEnabled: (enabled: boolean) => void
  setAIChatContext: (context: string) => void
  setAIChatDelay: (delay: number) => void
  setAIChatReadAloud: (readAloud: boolean) => void

  // Auto layout
  autoLayoutEnabled: boolean
  setAutoLayoutEnabled: (enabled: boolean) => void

  // Stage actions
  bringOnStage: (id: string) => void
  sendToBackstage: (id: string) => void
  setLayout: (layout: StudioLayout) => void
  setPinned: (id: string | null) => void
  // Guest queue actions
  addPendingGuest: (guest: PendingGuest) => void
  removePendingGuest: (guestId: string) => void
  clearPendingGuests: () => void
  // Text overlay actions
  addTextOverlay: (overlay: Omit<TextOverlay, "id">) => void
  removeTextOverlay: (id: string) => void
  updateTextOverlay: (id: string, updates: Partial<TextOverlay>) => void
  toggleTextOverlay: (id: string) => void
  setStageBackground: (color: string) => void
  // Streaming actions
  setLiveState: (isLive: boolean, egressId?: string, platforms?: string[], startedAt?: Date) => void
  addStreamPlatform: (platform: string) => void
  removeStreamPlatform: (platform: string) => void
  // Recording actions
  setRecordingState: (isRecording: boolean, egressId?: string | null, startedAt?: Date | null) => void
  // Chat overlay actions
  setChatOverlayEnabled: (enabled: boolean) => void
  setChatOverlayPosition: (position: ChatOverlayPosition) => void
  // F-11: Hydrate from persisted state
  hydrateFromSaved: (state: {
    activeLayout?: StudioLayout
    pinnedParticipantId?: string | null
    onScreenParticipantIds?: string[]
    tileOrder?: string[]
  }) => void

  /**
   * Drag-reorder result: explicit participant identity order. Empty array =
   * use natural connect order. Identities not in this array fall to the tail.
   */
  tileOrder: string[]
  setTileOrder: (order: string[]) => void
  moveTile: (identity: string, toIndex: number) => void
}

let overlayIdCounter = 0
function newOverlayId() {
  return `overlay-${Date.now()}-${++overlayIdCounter}`
}

export const useStudioStore = create<StudioStore>((set) => ({
  onScreenParticipantIds: [],
  activeLayout: "four-grid",
  pinnedParticipantId: null,
  pendingGuests: [],
  tileOrder: [],

  // Text overlays
  textOverlays: [],
  stageBackground: "#0d0d0d",

  // Streaming state
  isLive: false,
  streamEgressId: null,
  streamPlatforms: [],
  streamStartedAt: null,

  // Recording state
  isRecording: false,
  recordingEgressId: null,
  recordingStartedAt: null,

  // Chat overlay
  chatOverlayEnabled: false,
  chatOverlayPosition: "bottom-left" as ChatOverlayPosition,

  // AI chat assistant
  aiChatEnabled: false,
  aiChatContext: "",
  aiChatDelay: 10,
  aiChatReadAloud: false,
  setAIChatEnabled: (enabled) => set({ aiChatEnabled: enabled }),
  setAIChatContext: (context) => set({ aiChatContext: context }),
  setAIChatDelay: (delay) => set({ aiChatDelay: delay }),
  setAIChatReadAloud: (readAloud) => set({ aiChatReadAloud: readAloud }),

  // Auto layout
  autoLayoutEnabled: false,
  setAutoLayoutEnabled: (enabled) => set({ autoLayoutEnabled: enabled }),

  bringOnStage: (id) =>
    set((state) => ({
      onScreenParticipantIds: state.onScreenParticipantIds.includes(id)
        ? state.onScreenParticipantIds
        : [...state.onScreenParticipantIds, id],
    })),

  sendToBackstage: (id) =>
    set((state) => ({
      onScreenParticipantIds: state.onScreenParticipantIds.filter((p) => p !== id),
      pinnedParticipantId:
        state.pinnedParticipantId === id ? null : state.pinnedParticipantId,
      tileOrder: state.tileOrder.filter((p) => p !== id),
    })),

  setTileOrder: (order) => set({ tileOrder: order }),

  moveTile: (identity, toIndex) =>
    set((state) => {
      const without = state.tileOrder.filter((id) => id !== identity)
      const clamped = Math.max(0, Math.min(toIndex, without.length))
      const next = [...without.slice(0, clamped), identity, ...without.slice(clamped)]
      return { tileOrder: next }
    }),

  setLayout: (layout) => set({ activeLayout: layout }),

  setPinned: (id) => set({ pinnedParticipantId: id }),

  addPendingGuest: (guest) =>
    set((state) => ({
      pendingGuests: [
        ...state.pendingGuests.filter((g) => g.guestId !== guest.guestId),
        guest,
      ],
    })),

  removePendingGuest: (guestId) =>
    set((state) => ({
      pendingGuests: state.pendingGuests.filter((g) => g.guestId !== guestId),
    })),

  clearPendingGuests: () => set({ pendingGuests: [] }),

  // Text overlay actions
  addTextOverlay: (overlay) =>
    set((state) => ({
      textOverlays: [...state.textOverlays, { ...overlay, id: newOverlayId() }],
    })),

  removeTextOverlay: (id) =>
    set((state) => ({
      textOverlays: state.textOverlays.filter((o) => o.id !== id),
    })),

  updateTextOverlay: (id, updates) =>
    set((state) => ({
      textOverlays: state.textOverlays.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    })),

  toggleTextOverlay: (id) =>
    set((state) => ({
      textOverlays: state.textOverlays.map((o) =>
        o.id === id ? { ...o, visible: !o.visible } : o
      ),
    })),

  setStageBackground: (color) => set({ stageBackground: color }),

  // Streaming actions
  setLiveState: (isLive, egressId, platforms, startedAt) =>
    set({
      isLive,
      streamEgressId: egressId ?? null,
      streamPlatforms: platforms ?? [],
      streamStartedAt: startedAt ?? null,
    }),

  addStreamPlatform: (platform) =>
    set((state) => ({
      streamPlatforms: state.streamPlatforms.includes(platform)
        ? state.streamPlatforms
        : [...state.streamPlatforms, platform],
    })),

  removeStreamPlatform: (platform) =>
    set((state) => ({
      streamPlatforms: state.streamPlatforms.filter((p) => p !== platform),
    })),

  // Recording actions
  setRecordingState: (isRecording, egressId, startedAt) =>
    set({
      isRecording,
      recordingEgressId: egressId ?? null,
      recordingStartedAt: startedAt ?? null,
    }),

  // Chat overlay actions
  setChatOverlayEnabled: (enabled) => set({ chatOverlayEnabled: enabled }),
  setChatOverlayPosition: (position) => set({ chatOverlayPosition: position }),

  // F-11: Hydrate studio state from Redis-persisted snapshot.
  // Stale snapshots may carry a `saved.activeLayout` that no longer exists
  // in LAYOUT_PRESETS (e.g. after a preset id rename) — reject those so the
  // compositor doesn't crash on `preset.slots` of undefined.
  hydrateFromSaved: (saved) =>
    set((state) => ({
      activeLayout:
        saved.activeLayout && saved.activeLayout in LAYOUT_PRESETS
          ? saved.activeLayout
          : state.activeLayout,
      pinnedParticipantId: saved.pinnedParticipantId ?? state.pinnedParticipantId,
      onScreenParticipantIds: saved.onScreenParticipantIds ?? state.onScreenParticipantIds,
      tileOrder: saved.tileOrder ?? state.tileOrder,
    })),
}))
