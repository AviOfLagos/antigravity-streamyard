import { create } from "zustand"

interface PendingGuest {
  guestId: string
  name: string
}

export type StudioLayout = "grid" | "spotlight" | "screen-grid" | "screen-only" | "single"

export interface TextOverlay {
  id: string
  text: string
  position: "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  fontSize: "sm" | "md" | "lg"
  color: string       // hex color, default "#ffffff"
  bgColor: string     // hex color with opacity, default "#000000cc"
  visible: boolean
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
  // F-11: Hydrate from persisted state
  hydrateFromSaved: (state: {
    activeLayout?: StudioLayout
    pinnedParticipantId?: string | null
    onScreenParticipantIds?: string[]
  }) => void
}

let overlayIdCounter = 0
function newOverlayId() {
  return `overlay-${Date.now()}-${++overlayIdCounter}`
}

export const useStudioStore = create<StudioStore>((set) => ({
  onScreenParticipantIds: [],
  activeLayout: "grid",
  pinnedParticipantId: null,
  pendingGuests: [],

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
    })),

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

  // F-11: Hydrate studio state from Redis-persisted snapshot
  hydrateFromSaved: (saved) =>
    set((state) => ({
      activeLayout: saved.activeLayout ?? state.activeLayout,
      pinnedParticipantId: saved.pinnedParticipantId ?? state.pinnedParticipantId,
      onScreenParticipantIds: saved.onScreenParticipantIds ?? state.onScreenParticipantIds,
    })),
}))
