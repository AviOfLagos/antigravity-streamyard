import React, { useState } from "react"

import { Bot } from "lucide-react"

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

const EVENT_STYLES: Record<string, { bg: string; border: string; label?: string }> = {
  donation: { bg: "bg-yellow-500/5", border: "border-l-yellow-500/40", label: "donation" },
  subscription: { bg: "bg-indigo-500/5", border: "border-l-indigo-500/40", label: "sub" },
  follow: { bg: "bg-emerald-500/5", border: "border-l-emerald-500/40", label: "follow" },
  raid: { bg: "bg-blue-500/5", border: "border-l-blue-500/40", label: "raid" },
  like: { bg: "bg-pink-500/5", border: "border-l-pink-500/40" },
  join: { bg: "bg-gray-500/5", border: "border-l-gray-500/20" },
  system: { bg: "bg-gray-500/5", border: "border-l-gray-500/20" },
}

interface ChatMessageProps {
  message: ChatMessageType
  /** True when the previous visible message has the same author within ~60s.
   *  Header (name + colored bar) is collapsed for visual grouping. */
  isContinuation?: boolean
}

function ChatMessageInner({ message, isContinuation = false }: ChatMessageProps) {
  const platformColor = PLATFORM_COLORS[message.platform]
  const [expanded, setExpanded] = useState(false)
  const eventType = message.eventType ?? "text"
  const isEvent = eventType !== "text" && eventType !== "join"
  const style = EVENT_STYLES[eventType]
  const isAi = message.platform === "ai"

  const isLong = message.message.length > MAX_MESSAGE_LENGTH
  const displayText = isLong && !expanded
    ? message.message.slice(0, MAX_MESSAGE_LENGTH) + "..."
    : message.message

  // Skip join events (too noisy for TikTok)
  if (eventType === "join") return null

  // Like events — compact display
  if (eventType === "like") {
    return (
      <div className="flex gap-2 px-3 py-1 text-[10px] text-pink-400/60">
        <span>{message.author.name} liked</span>
      </div>
    )
  }

  // AI replies get an emphasized chrome — solid background tint + permanent
  // accent bar + bot icon — so the host can see at a glance which messages
  // the assistant has handled.
  const containerBg = isAi
    ? "bg-indigo-500/10 hover:bg-indigo-500/15"
    : "hover:bg-white/2"
  const verticalPadding = isContinuation ? "py-0.5" : "py-2"

  return (
    <div
      className={`group relative flex gap-2.5 px-3 ${verticalPadding} ${containerBg} transition-colors ${
        style ? `${style.bg} border-l-2 ${style.border}` : ""
      }`}
      style={!style ? { borderLeft: `2px solid ${isAi ? platformColor : platformColor + "40"}` } : undefined}
    >
      {/* Platform accent bar on hover (text messages only); always visible on AI */}
      {!style && (
        <div
          aria-hidden="true"
          className={`absolute left-0 top-0 bottom-0 w-0.5 transition-opacity ${
            isAi ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          }`}
          style={{ backgroundColor: platformColor }}
        />
      )}

      <div className="flex-1 min-w-0">
        {/* Event badge for non-text events */}
        {isEvent && style?.label && (
          <span className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mr-1.5">
            {style.label}
          </span>
        )}

        {/* Reply context */}
        {message.replyTo && !isContinuation && (
          <div className="text-[10px] text-gray-500 mb-0.5 truncate">
            replying to <span className="text-gray-400">{message.replyTo.authorName}</span>
          </div>
        )}

        <div className="flex items-baseline gap-1.5 flex-wrap">
          {!isContinuation && (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-semibold leading-none shrink-0"
              style={{ color: message.author.color ?? (isAi ? "#a5b4fc" : "#9ca3af") }}
            >
              {isAi && <Bot className="w-3 h-3" aria-hidden="true" />}
              {message.author.name}
            </span>
          )}

          {/* Donation amount badge */}
          {message.donation && (
            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded-full">
              {message.donation.formattedAmount}
            </span>
          )}

          {/* Subscription tier badge */}
          {message.subscription && (
            <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
              {message.subscription.tier ?? "Sub"}
              {message.subscription.isGift && message.subscription.gifterName
                ? ` from ${message.subscription.gifterName}`
                : ""}
            </span>
          )}

          {/* Raid viewer count */}
          {message.raid && (
            <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-full">
              {message.raid.viewerCount} viewers
            </span>
          )}

          <span className="text-[11px] text-gray-300 wrap-break-word leading-snug">
            {displayText}
            {isLong && (
              <button
                type="button"
                className="ml-1 text-indigo-400 hover:text-indigo-300 text-[10px] font-medium transition-colors focus:outline-none focus-visible:underline focus-visible:underline-offset-2"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </span>
        </div>
      </div>

      {/* Timestamp — visible on hover, focus-within, or always on touch (no hover) */}
      <span className="text-[9px] text-gray-600 shrink-0 leading-none pt-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-60 transition-opacity">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}

const ChatMessage = React.memo(
  ChatMessageInner,
  (prev, next) =>
    prev.message.id === next.message.id && prev.isContinuation === next.isContinuation
)
export default ChatMessage
