import React, { useState } from "react"

import type { ChatMessage as ChatMessageType } from "@/lib/chat/types"
import { PLATFORM_COLORS } from "./PlatformBadge"

const MAX_MESSAGE_LENGTH = 500

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  } catch {
    return ""
  }
}

function ChatMessageInner({ message }: { message: ChatMessageType }) {
  const platformColor = PLATFORM_COLORS[message.platform]
  const [expanded, setExpanded] = useState(false)

  const isLong = message.message.length > MAX_MESSAGE_LENGTH
  const displayText = isLong && !expanded
    ? message.message.slice(0, MAX_MESSAGE_LENGTH) + "..."
    : message.message

  return (
    <div
      className="group relative flex gap-2.5 px-3 py-2 hover:bg-white/2 transition-colors"
      style={{ borderLeft: `2px solid ${platformColor}20` }}
    >
      {/* Platform accent bar on hover */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: platformColor }}
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className="text-[11px] font-semibold leading-none shrink-0"
            style={{ color: message.author.color ?? "#9ca3af" }}
          >
            {message.author.name}
          </span>
          <span className="text-[11px] text-gray-300 wrap-break-word leading-snug">
            {displayText}
            {isLong && (
              <button
                type="button"
                className="ml-1 text-violet-400 hover:text-violet-300 text-[10px] font-medium transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Timestamp — visible on hover */}
      <span className="text-[9px] text-gray-600 shrink-0 leading-none pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

const ChatMessage = React.memo(ChatMessageInner, (prev, next) => prev.message.id === next.message.id)
export default ChatMessage
