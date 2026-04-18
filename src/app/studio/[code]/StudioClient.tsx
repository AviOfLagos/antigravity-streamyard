"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LiveKitRoom } from "@livekit/components-react"
import { MessageSquare, X, Zap } from "lucide-react"

import ChatPanel from "@/components/chat/ChatPanel"
import ControlBar from "@/components/studio/ControlBar"
import GuestRequestToast from "@/components/studio/GuestRequestToast"
import VideoGrid from "@/components/studio/VideoGrid"
import type { SSEEventData } from "@/lib/chat/types"
import { useChatStore } from "@/store/chat"
import { useStudioStore } from "@/store/studio"

interface StudioClientProps {
  roomCode: string
  hostToken: string
  livekitUrl: string
  userName: string
}

export default function StudioClient({ roomCode, hostToken, livekitUrl }: StudioClientProps) {
  const { addPendingGuest, removePendingGuest } = useStudioStore()
  const { addMessage } = useChatStore()
  const sseRef = useRef<EventSource | null>(null)
  const startedConnectors = useRef(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [sseOk, setSseOk] = useState(true)
  const [lkConnected, setLkConnected] = useState(true)

  const handleSSEEvent = useCallback((event: SSEEventData) => {
    switch (event.type) {
      case "GUEST_REQUEST":
        addPendingGuest({ guestId: event.data.guestId, name: event.data.name })
        break
      case "GUEST_ADMITTED":
      case "GUEST_DENIED":
        removePendingGuest(event.data.guestId)
        break
      case "CHAT_MESSAGE":
        addMessage(event.data)
        break
      case "CONNECTION_ERROR":
        setSseOk(false)
        break
      case "STUDIO_ENDED":
        window.location.href = "/dashboard"
        break
    }
  }, [addPendingGuest, removePendingGuest, addMessage])

  useEffect(() => {
    const since = Date.now() - 1000
    const es = new EventSource(`/api/rooms/${roomCode}/stream?since=${since}`)
    sseRef.current = es
    es.onmessage = (e) => {
      setSseOk(true)
      try { handleSSEEvent(JSON.parse(e.data) as SSEEventData) } catch {}
    }
    es.onerror = () => setSseOk(false)
    if (!startedConnectors.current) {
      startedConnectors.current = true
      fetch(`/api/rooms/${roomCode}/chat/connect`, { method: "POST" }).catch(console.error)
    }
    return () => { es.close() }
  }, [roomCode, handleSSEEvent])

  // G17 — guard against undefined livekitUrl (after all hooks)
  if (!livekitUrl) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#0d0d0d]">
        <div className="text-center px-6">
          <p className="text-white font-semibold mb-2">Configuration error</p>
          <p className="text-gray-400 text-sm">LiveKit URL is not configured. Contact support.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0d0d0d] overflow-hidden">
      {/* Fixed overlay toasts — pass hostToken for demo/direct-access auth */}
      <GuestRequestToast roomCode={roomCode} hostToken={hostToken} />

      {/* Header */}
      <header className="flex-none h-12 flex items-center justify-between px-4 bg-[#080808] border-b border-white/6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <Zap className="w-4 h-4 text-violet-400" />
            Zerocast
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="font-mono text-[11px] text-gray-500 tracking-widest uppercase">
            {roomCode}
          </span>
        </div>
        {/* Mobile chat toggle */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/6 transition-colors"
          onClick={() => setChatOpen(o => !o)}
          aria-label="Toggle chat"
        >
          {chatOpen ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
        </button>
      </header>

      {/* LiveKit room wraps everything so ControlBar has access to context */}
      <LiveKitRoom
        token={hostToken}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={true}
        className="flex flex-1 overflow-hidden"
        onDisconnected={() => setLkConnected(false)}
        onConnected={() => setLkConnected(true)}
      >
        {/* Stage: video + controls */}
        <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <VideoGrid roomCode={roomCode} isHost={true} />
          </div>
          {/* ControlBar is now inside LiveKitRoom — TrackToggle hooks work here */}
          <ControlBar roomCode={roomCode} />

          {/* G35 — LiveKit disconnection overlay */}
          {!lkConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
              <div className="text-center">
                <p className="text-white font-semibold mb-1">Connection lost</p>
                <p className="text-gray-300 text-sm">Attempting to reconnect…</p>
              </div>
            </div>
          )}
        </div>

        {/* Chat panel — slide in from right on mobile */}
        <div
          className={[
            "flex-col border-l border-white/6 bg-[#0d0d0d]",
            "lg:flex lg:w-72 xl:w-80",
            // Mobile: absolute overlay
            chatOpen
              ? "flex absolute right-0 top-12 bottom-0 w-full sm:w-80 z-30 shadow-2xl"
              : "hidden",
          ].join(" ")}
        >
          <ChatPanel roomCode={roomCode} isHost={true} />
        </div>
      </LiveKitRoom>

      {/* G13 — SSE connection error banner */}
      {!sseOk && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-red-500/15 border border-red-500/20 text-red-300 text-xs px-4 py-2 rounded-full z-50">
          Connection interrupted — events may be delayed
        </div>
      )}
    </div>
  )
}
