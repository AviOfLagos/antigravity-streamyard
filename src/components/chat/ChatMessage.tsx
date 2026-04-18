import type { ChatMessage as ChatMessageType } from "@/lib/chat/types"
import PlatformBadge from "./PlatformBadge"

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  return (
    <div className="flex gap-2 py-1.5 px-3 hover:bg-gray-800/50 group">
      <PlatformBadge platform={message.platform} />
      <div className="flex-1 min-w-0">
        <span
          className="text-xs font-semibold mr-1.5"
          style={{ color: message.author.color ?? "#9ca3af" }}
        >
          {message.author.name}
        </span>
        <span className="text-xs text-gray-200 break-words">{message.message}</span>
      </div>
    </div>
  )
}
