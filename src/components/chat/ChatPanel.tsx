"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDown, MessageSquare } from "lucide-react"

import { useChatStore } from "@/store/chat"

import ChatMessage from "./ChatMessage"
import PlatformFilter from "./PlatformFilter"

interface ChatPanelProps {
  roomCode: string
  isHost: boolean
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ChatPanel({ roomCode, isHost }: ChatPanelProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const storeMessages = useChatStore((s) => s.messages)
  const filters = useChatStore((s) => s.filters)

  const messages = useMemo(
    () => storeMessages.filter((m) => filters[m.platform]),
    [storeMessages, filters]
  )

  // Track whether user is at bottom for auto-scroll
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessages, setHasNewMessages] = useState(false)
  const prevMessageCountRef = useRef(messages.length)

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36, // estimated row height in px
    overscan: 5,
  })

  // Check if user is at bottom of scroll
  const checkIsAtBottom = useCallback(() => {
    const el = parentRef.current
    if (!el) return true
    return el.scrollTop + el.clientHeight >= el.scrollHeight - 50
  }, [])

  // Handle scroll events to track position
  const handleScroll = useCallback(() => {
    const atBottom = checkIsAtBottom()
    setIsAtBottom(atBottom)
    if (atBottom) {
      setHasNewMessages(false)
    }
  }, [checkIsAtBottom])

  // Auto-scroll to bottom when new messages arrive (only if already at bottom)
  useEffect(() => {
    const newCount = messages.length
    const prevCount = prevMessageCountRef.current
    prevMessageCountRef.current = newCount

    if (newCount > prevCount) {
      if (isAtBottom) {
        // Scroll to bottom
        virtualizer.scrollToIndex(newCount - 1, { align: "end" })
      } else {
        // User is scrolled up — show indicator
        setHasNewMessages(true)
      }
    }
  }, [messages.length, isAtBottom, virtualizer])

  // Scroll to bottom handler for the "New messages" pill
  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(messages.length - 1, { align: "end" })
    setHasNewMessages(false)
    setIsAtBottom(true)
  }, [virtualizer, messages.length])

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Header */}
      <div className="flex-none flex items-center gap-2 px-3 py-2.5 border-b border-white/6">
        <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-white tracking-wide">Live Chat</span>
        {messages.length > 0 && (
          <span className="ml-auto text-[10px] text-gray-600 tabular-nums">
            {messages.length}
          </span>
        )}
      </div>

      {/* Platform filters */}
      <PlatformFilter />

      {/* Messages — virtualized */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#ffffff10_transparent] relative"
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <MessageSquare className="w-7 h-7 text-white/10" />
            <p className="text-gray-600 text-xs">No messages yet</p>
            <p className="text-gray-700 text-[10px] leading-relaxed">
              Connect platforms to see chat here
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const msg = messages[virtualRow.index]
              return (
                <div
                  key={msg.id}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <ChatMessage message={msg} />
                </div>
              )
            })}
          </div>
        )}

        {/* "New messages" floating pill */}
        {hasNewMessages && !isAtBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="sticky bottom-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/90 hover:bg-violet-500/90 text-white text-[11px] font-medium rounded-full shadow-lg backdrop-blur-sm transition-colors"
          >
            <ArrowDown className="w-3 h-3" />
            New messages
          </button>
        )}
      </div>
    </div>
  )
}
