"use client"

import { useEffect, useRef, useState } from "react"

import { useChatStore } from "@/store/chat"
import type { ChatMessage } from "@/lib/chat/types"
import type { ChatOverlayPosition } from "@/store/studio"

interface ChatOverlayProps {
  position?: ChatOverlayPosition
}

interface VisibleMessage {
  msg: ChatMessage
  /** epoch ms when this message should start fading */
  fadeAt: number
}

const SHOW_COUNT = 4
const FADE_AFTER_MS = 8000

const POSITION_CLASSES: Record<ChatOverlayPosition, string> = {
  "bottom-left": "bottom-4 left-4 items-start",
  "bottom-right": "bottom-4 right-4 items-end",
  "top-left": "top-4 left-4 items-start",
  "top-right": "top-4 right-4 items-end",
}

/** Returns a short platform label color */
function platformColor(platform: string): string {
  const MAP: Record<string, string> = {
    youtube: "#ff0000",
    twitch: "#9146ff",
    kick: "#53fc18",
    tiktok: "#69c9d0",
    host: "#8b5cf6",
  }
  return MAP[platform.toLowerCase()] ?? "#6b7280"
}

export default function ChatOverlay({ position = "bottom-left" }: ChatOverlayProps) {
  const messages = useChatStore((s) => s.messages)
  const [visible, setVisible] = useState<VisibleMessage[]>([])
  const prevLenRef = useRef(messages.length)

  // When new messages arrive, push them into visible list
  useEffect(() => {
    if (messages.length === prevLenRef.current) return
    const newMsgs = messages.slice(prevLenRef.current)
    prevLenRef.current = messages.length
    setVisible((prev) => {
      const now = Date.now()
      const appended = [
        ...prev,
        ...newMsgs.map((m) => ({ msg: m, fadeAt: now + FADE_AFTER_MS })),
      ]
      // Keep only the last SHOW_COUNT
      return appended.slice(-SHOW_COUNT)
    })
  }, [messages])

  // Tick to remove faded messages
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      setVisible((prev) => prev.filter((v) => v.fadeAt > now))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  if (visible.length === 0) return null

  const posClass = POSITION_CLASSES[position]

  return (
    <div
      className={`absolute z-20 pointer-events-none flex flex-col gap-1.5 max-w-[260px] ${posClass}`}
      aria-hidden="true"
    >
      {visible.map(({ msg, fadeAt }) => {
        const remaining = fadeAt - Date.now()
        const opacity = remaining < 2000 ? Math.max(0, remaining / 2000) : 1
        return (
          <div
            key={msg.id}
            className="flex items-start gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-white"
            style={{ opacity, transition: "opacity 0.5s ease" }}
          >
            {/* Platform color dot */}
            <span
              className="mt-0.5 w-1.5 h-1.5 rounded-full flex-none shrink-0"
              style={{ backgroundColor: platformColor(msg.platform) }}
            />
            <div className="min-w-0">
              <span className="text-[10px] font-semibold text-gray-300 mr-1">
                {msg.author.name}
              </span>
              <span className="text-[10px] text-gray-200 break-words">
                {msg.message}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
