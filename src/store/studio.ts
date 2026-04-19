import { create } from "zustand"

interface PendingGuest {
  guestId: string
  name: string
}

export type StudioLayout = "grid" | "spotlight" | "screen-grid" | "screen-only" | "single"

interface StudioStore {
  // Explicit list of on-stage participant identities (empty = show all)
  onScreenParticipantIds: string[]
  // Active layout preset
  activeLayout: StudioLayout
  // Pinned participant (used in spotlight / single)
  pinnedParticipantId: string | null
  // Pending guest requests
  pendingGuests: PendingGuest[]

  // Streaming state
  isLive: boolean
  streamEgressId: string | null
  streamPlatforms: string[]
  streamStartedAt: Date | null

  // Stage actions
  bringOnStage: (id: string) => void
  sendToBackstage: (id: string) => void
  setLayout: (layout: StudioLayout) => void
  setPinned: (id: string | null) => void
  // Guest queue actions
  addPendingGuest: (guest: PendingGuest) => void
  removePendingGuest: (guestId: string) => void
  clearPendingGuests: () => void
  // Streaming actions
  setLiveState: (isLive: boolean, egressId?: string, platforms?: string[], startedAt?: Date) => void
  addStreamPlatform: (platform: string) => void
  removeStreamPlatform: (platform: string) => void
  // F-11: Hydrate from persisted state
  hydrateFromSaved: (state: {
    activeLayout?: StudioLayout
    pinnedParticipantId?: string | null
    onScreenParticipantIds?: string[]
  }) => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  onScreenParticipantIds: [],
  activeLayout: "grid",
  pinnedParticipantId: null,
  pendingGuests: [],

  // Streaming state
  isLive: false,
  streamEgressId: null,
  streamPlatforms: [],
  streamStartedAt: null,

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

  // F-11: Hydrate studio state from Redis-persisted snapshot
  hydrateFromSaved: (saved) =>
    set((state) => ({
      activeLayout: saved.activeLayout ?? state.activeLayout,
      pinnedParticipantId: saved.pinnedParticipantId ?? state.pinnedParticipantId,
      onScreenParticipantIds: saved.onScreenParticipantIds ?? state.onScreenParticipantIds,
    })),
}))
