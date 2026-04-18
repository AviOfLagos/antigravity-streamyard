import { create } from "zustand"

interface PendingGuest {
  guestId: string
  name: string
}

interface StudioStore {
  // On-screen state (which participants are visible)
  onScreen: Record<string, boolean>
  // Pending guest requests
  pendingGuests: PendingGuest[]

  toggleOnScreen: (participantId: string) => void
  setOnScreen: (participantId: string, value: boolean) => void
  addPendingGuest: (guest: PendingGuest) => void
  removePendingGuest: (guestId: string) => void
  clearPendingGuests: () => void
}

export const useStudioStore = create<StudioStore>((set) => ({
  onScreen: {},
  pendingGuests: [],

  toggleOnScreen: (id) =>
    set((state) => ({
      onScreen: { ...state.onScreen, [id]: !(state.onScreen[id] ?? true) },
    })),

  setOnScreen: (id, value) =>
    set((state) => ({
      onScreen: { ...state.onScreen, [id]: value },
    })),

  addPendingGuest: (guest) =>
    set((state) => ({
      pendingGuests: [...state.pendingGuests.filter((g) => g.guestId !== guest.guestId), guest],
    })),

  removePendingGuest: (guestId) =>
    set((state) => ({
      pendingGuests: state.pendingGuests.filter((g) => g.guestId !== guestId),
    })),

  clearPendingGuests: () => set({ pendingGuests: [] }),
}))
