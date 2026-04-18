import { create } from "zustand"
import type { ChatMessage, Platform } from "@/lib/chat/types"

interface ChatStore {
  messages: ChatMessage[]
  filters: Record<Platform, boolean>
  addMessage: (msg: ChatMessage) => void
  toggleFilter: (platform: Platform) => void
  clearMessages: () => void
  filteredMessages: () => ChatMessage[]
}

const MAX_MESSAGES = 500

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  filters: {
    youtube: true,
    twitch: true,
    kick: true,
    tiktok: true,
  },

  addMessage: (msg) =>
    set((state) => {
      const messages = [...state.messages, msg]
      // Cap at MAX_MESSAGES to prevent memory issues
      return { messages: messages.slice(-MAX_MESSAGES) }
    }),

  toggleFilter: (platform) =>
    set((state) => ({
      filters: { ...state.filters, [platform]: !state.filters[platform] },
    })),

  clearMessages: () => set({ messages: [] }),

  filteredMessages: () => {
    const { messages, filters } = get()
    return messages.filter((m) => filters[m.platform])
  },
}))
