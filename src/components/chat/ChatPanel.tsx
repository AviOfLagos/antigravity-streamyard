"use client"

import { useEffect, useRef } from "react"

import { MessageSquare } from "lucide-react"

import { useChatStore } from "@/store/chat"

import ChatMessage from "./ChatMessage"
import PlatformFilter from "./PlatformFilter"

interface ChatPanelProps {
  roomCode: string
  isHost: boolean
}

export default function ChatPanel({ roomCode: _roomCode, isHost: _isHost }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { filteredMessages } = useChatStore()
  const messages = filteredMessages()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#ffffff10_transparent]">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-4 text-center">
            <MessageSquare className="w-7 h-7 text-white/10" />
            <p className="text-gray-600 text-xs">No messages yet</p>
            <p className="text-gray-700 text-[10px] leading-relaxed">
              Connect platforms to see chat here
            </p>
          </div>
        ) : (
          <div className="py-1">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}
