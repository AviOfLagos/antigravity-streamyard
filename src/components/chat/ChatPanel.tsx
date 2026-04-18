"use client"

import { useEffect, useRef } from "react"
import { useChatStore } from "@/store/chat"
import ChatMessage from "./ChatMessage"
import PlatformFilter from "./PlatformFilter"
import { MessageSquare } from "lucide-react"

interface ChatPanelProps {
  roomCode: string
  isHost: boolean
}

export default function ChatPanel({ roomCode, isHost }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { filteredMessages } = useChatStore()
  const messages = filteredMessages()

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-800">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium text-gray-200">Live Chat</span>
        <span className="ml-auto text-xs text-gray-500">{messages.length}</span>
      </div>

      {/* Platform filters */}
      <PlatformFilter />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageSquare className="w-8 h-8 text-gray-700 mb-2" />
            <p className="text-gray-600 text-sm">No chat messages yet</p>
            <p className="text-gray-700 text-xs mt-1">
              Connect platforms in Settings to see chat
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
