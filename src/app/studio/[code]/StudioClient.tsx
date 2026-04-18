"use client"

import { useCallback, useEffect, useRef } from "react"

import { LiveKitRoom } from "@livekit/components-react"

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

export default function StudioClient({ roomCode, hostToken, livekitUrl, userName: _userName }: StudioClientProps) {
  const { addPendingGuest, removePendingGuest } = useStudioStore()
  const { addMessage } = useChatStore()
  const sseRef = useRef<EventSource | null>(null)
  const startedConnectors = useRef(false)

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
      try {
        const data = JSON.parse(e.data) as SSEEventData
        handleSSEEvent(data)
      } catch {
        // ignore parse errors
      }
    }

    // Start chat connectors
    if (!startedConnectors.current) {
      startedConnectors.current = true
      fetch(`/api/rooms/${roomCode}/chat/connect`, { method: "POST" })
        .catch(console.error)
    }

    return () => { es.close() }
  }, [roomCode, handleSSEEvent])

  // End studio on tab close (best-effort)
  useEffect(() => {
    const handleUnload = () => {
      navigator.sendBeacon(`/api/rooms/${roomCode}/end`)
    }
    window.addEventListener("beforeunload", handleUnload)
    return () => window.removeEventListener("beforeunload", handleUnload)
  }, [roomCode])

  return (
    <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">
      {/* Guest request toasts */}
      <GuestRequestToast roomCode={roomCode} />

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className="flex-1 overflow-hidden">
          <LiveKitRoom
            token={hostToken}
            serverUrl={livekitUrl}
            connect={true}
            video={true}
            audio={true}
            className="h-full"
          >
            <VideoGrid roomCode={roomCode} />
          </LiveKitRoom>
        </div>

        {/* Chat panel */}
        <div className="w-80 border-l border-gray-800 flex flex-col">
          <ChatPanel roomCode={roomCode} isHost={true} />
        </div>
      </div>

      {/* Control bar */}
      <div className="border-t border-gray-800">
        <ControlBar roomCode={roomCode} />
      </div>
    </div>
  )
}
