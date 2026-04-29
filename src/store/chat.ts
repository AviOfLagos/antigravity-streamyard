import { create } from "zustand"
import type { ChatMessage, Platform } from "@/lib/chat/types"

interface ChatStore {
  /** Internal Map for O(1) dedup by message id */
  _messageMap: Map<string, ChatMessage>
  /** Sorted array for consumers — derived from _messageMap */
  messages: ChatMessage[]
  filters: Record<Platform, boolean>
  addMessage: (msg: ChatMessage) => void
  toggleFilter: (platform: Platform) => void
  clearMessages: () => void
  // F-11: Hydrate chat filter state from persisted data
  hydrateFilters: (filters: Partial<Record<Platform, boolean>>) => void
}

const MAX_MESSAGES = 500

export const useChatStore = create<ChatStore>((set) => ({
  _messageMap: new Map(),
  messages: [],
  filters: {
    youtube: true,
    twitch: true,
    kick: true,
    tiktok: true,
    // Host messages are always shown and not user-togglable
    host: true,
    // Guest messages are always shown
    guest: true,
  },

  addMessage: (msg) =>
    set((state) => {
      // O(1) dedup — skip if message id already exists
      if (state._messageMap.has(msg.id)) return state

      const newMap = new Map(state._messageMap)
      newMap.set(msg.id, msg)

      // Cap at MAX_MESSAGES — remove oldest entries if over limit
      if (newMap.size > MAX_MESSAGES) {
        const keysToDelete = Array.from(newMap.keys()).slice(0, newMap.size - MAX_MESSAGES)
        for (const key of keysToDelete) {
          newMap.delete(key)
        }
      }

      // Convert Map to sorted array (insertion order is preserved by Map)
      const messages = Array.from(newMap.values())

      return { _messageMap: newMap, messages }
    }),

  toggleFilter: (platform) =>
    set((state) => ({
      filters: { ...state.filters, [platform]: !state.filters[platform] },
    })),

  clearMessages: () => set({ _messageMap: new Map(), messages: [] }),

  // F-11: Hydrate chat filters from Redis-persisted state
  hydrateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
}))
