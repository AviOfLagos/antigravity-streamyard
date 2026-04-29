"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useVirtualizer } from "@tanstack/react-virtual"
import { ArrowDown, ChevronRight, MessageSquare, Send } from "lucide-react"

import { useChatStore } from "@/store/chat"
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types"

import ChatMessage from "./ChatMessage"
import PlatformFilter from "./PlatformFilter"

interface ChatPanelProps {
  roomCode: string
  isHost: boolean
  /** Guest display name — used as author for guest chat messages */
  displayName?: string
  onCollapse?: () => void
  collapsed?: boolean
  connectedPlatforms?: { platform: string; channelName: string }[]
  /** Called when a guest submits a chat message — the parent relays it to the room */
  onGuestSend?: (message: string) => void
}

export default function ChatPanel({ roomCode, isHost, displayName, onCollapse, collapsed, connectedPlatforms, onGuestSend }: ChatPanelProps) {
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
          <span className="text-[10px] text-gray-600 tabular-nums">
            {messages.length}
          </span>
        )}
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="ml-auto p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/6 transition-colors"
            aria-label={collapsed ? "Expand chat" : "Collapse chat"}
            title={collapsed ? "Expand chat" : "Collapse chat"}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Platform filters */}
      <PlatformFilter connectedPlatforms={connectedPlatforms} />

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
              {isHost ? "Connect platforms to see chat here" : "Be the first to say something"}
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

      {/* Chat input — host sends via API, guest sends via relay callback */}
      {isHost
        ? <ChatInput roomCode={roomCode} />
        : <GuestChatInput displayName={displayName ?? "Guest"} onSend={onGuestSend} />
      }
    </div>
  )
}

function GuestChatInput({ displayName, onSend }: { displayName: string; onSend?: (msg: string) => void }) {
  const [text, setText] = useState("")
  const addMessage = useChatStore((s) => s.addMessage)

  const handleSend = () => {
    const msg = text.trim()
    if (!msg) return
    // Optimistically add to local store so the sender sees their own message immediately
    const guestMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      platform: "guest",
      author: { name: displayName },
      message: msg,
      timestamp: new Date().toISOString(),
      eventType: "text",
    }
    addMessage(guestMsg)
    onSend?.(msg)
    setText("")
  }

  return (
    <div className="flex-none border-t border-white/6 px-2 py-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send to chat..."
          maxLength={500}
          className="flex-1 bg-white/4 text-white text-xs placeholder:text-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-500/30 transition-colors"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="p-2 rounded-lg text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-30 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[9px] text-gray-700 mt-1 px-1">
        Visible to everyone in the room
      </p>
    </div>
  )
}

function ChatInput({ roomCode }: { roomCode: string }) {
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const addMessage = useChatStore((s) => s.addMessage)

  const handleSend = async () => {
    const msg = text.trim()
    if (!msg || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      })
      // Add the host's own message to the local chat store immediately
      // Use the hostMessageId returned by the API so it matches the Redis
      // entry and the SSE dedup layer won't show it twice.
      const data = await res.json().catch(() => ({}))
      const hostMsg: ChatMessageType = {
        id: (data.hostMessageId as string | undefined) ?? crypto.randomUUID(),
        platform: "host",
        author: { name: "You" },
        message: msg,
        timestamp: new Date().toISOString(),
        eventType: "text",
      }
      addMessage(hostMsg)
      setText("")
    } catch {
      // Silent fail — non-critical
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex-none border-t border-white/6 px-2 py-2">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Send to chat..."
          maxLength={500}
          className="flex-1 bg-white/4 text-white text-xs placeholder:text-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-violet-500/30 transition-colors"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/10 disabled:opacity-30 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[9px] text-gray-700 mt-1 px-1">
        Sends to YouTube and Twitch
      </p>
    </div>
  )
}
