export type Platform = "youtube" | "twitch" | "kick" | "tiktok"

export interface ChatMessage {
  id: string
  platform: Platform
  author: {
    name: string
    avatar?: string
    color?: string
    badges?: string[]
  }
  message: string
  timestamp: string // ISO string
}

export type SSEEventData =
  | { type: "CHAT_MESSAGE"; data: ChatMessage }
  | { type: "GUEST_REQUEST"; data: { guestId: string; name: string } }
  | { type: "GUEST_ADMITTED"; data: { guestId: string; token: string } }
  | { type: "GUEST_DENIED"; data: { guestId: string } }
  | { type: "GUEST_LEFT"; data: { participantId: string } }
  | { type: "STUDIO_ENDED" }
  | { type: "PING" }
