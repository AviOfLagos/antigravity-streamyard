import { create } from "zustand"

interface PendingGuest {
  guestId: string
  name: string
}

export type StudioLayout = "grid" | "spotlight" | "screen-grid" | "screen-only" | "single"

interface StudioStore {
  // Legacy on-screen toggle (kept for backwards compat)
  onScreen: Record<string, boolean>
  // New: explicit list of on-stage participant identities (empty = show all)
  onScreenParticipantIds: string[]
  // Active layout preset
  activeLayout: StudioLayout
  // Pinned participant (used in spotlight / single)
  pinnedParticipantId: string | null
  // Pending guest requests
  pendingGuests: PendingGuest[]

  // Legacy actions
  toggleOnScreen: (participantId: string) => void
  setOnScreen: (participantId: string, value: boolean) => void
  // New stage actions
  bringOnStage: (id: string) => void
  sendToBackstage: (id: string) => void
  setLayout: (layout: StudioLayout) => void
  setPinned: (id: string | null) => void
  // Guest queue actions
  addPendingGuest: (guest: PendingGuest) => void
  removePendingGuest: (guestId: string) => void
  clearPendingGuests: () => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  onScreen: {},
  onScreenParticipantIds: [],
  activeLayout: "grid",
  pinnedParticipantId: null,
  pendingGuests: [],

  toggleOnScreen: (id) =>
    set((state) => ({
      onScreen: { ...state.onScreen, [id]: !(state.onScreen[id] ?? true) },
    })),

  setOnScreen: (id, value) =>
    set((state) => ({
      onScreen: { ...state.onScreen, [id]: value },
    })),

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
}))
