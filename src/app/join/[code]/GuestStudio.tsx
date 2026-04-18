"use client"

import { useCallback, useEffect, useRef } from "react"
import { ControlBar as LKControlBar, useParticipants, useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"
import ChatPanel from "@/components/chat/ChatPanel"
import VideoTile from "@/components/studio/VideoTile"
import type { SSEEventData } from "@/lib/chat/types"
import { useChatStore } from "@/store/chat"

interface GuestStudioProps {
  roomCode: string
  displayName: string
}

export default function GuestStudio({ roomCode, displayName }: GuestStudioProps) {
  // participants kept for LiveKit subscription side-effects
  const participants = useParticipants()
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ])
  const { addMessage } = useChatStore()
  const sseRef = useRef<EventSource | null>(null)

  const handleSSEEvent = useCallback((event: SSEEventData) => {
    if (event.type === "CHAT_MESSAGE") {
      addMessage(event.data)
    }
    if (event.type === "STUDIO_ENDED") {
      window.location.href = "/studio-ended"
    }
  }, [addMessage])

  useEffect(() => {
    const since = Date.now() - 1000
    const es = new EventSource(`/api/rooms/${roomCode}/stream?since=${since}`)
    sseRef.current = es
    es.onmessage = (e) => {
      try { handleSSEEvent(JSON.parse(e.data) as SSEEventData) } catch {}
    }
    return () => { es.close() }
  }, [roomCode, handleSSEEvent])

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1"
    if (count <= 2) return "grid-cols-2"
    return "grid-cols-2"
  }

  const cameraTrackRefs = tracks.filter(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  )

  return (
    <div className="flex flex-col h-screen bg-gray-950">
      <div className="flex flex-1 overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`grid ${getGridClass(cameraTrackRefs.length)} gap-2 h-full content-center`}>
            {cameraTrackRefs.map((trackRef) => (
              <VideoTile
                key={`${trackRef.participant.identity}-${trackRef.source}`}
                trackRef={trackRef}
                isVisible={true}
                isLocal={trackRef.participant.isLocal}
              />
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="w-80 border-l border-gray-800">
          <ChatPanel roomCode={roomCode} isHost={false} />
        </div>
      </div>

      {/* LiveKit built-in controls for guest */}
      <div className="border-t border-gray-800 bg-gray-900 p-3 flex justify-center">
        <LKControlBar
          controls={{ microphone: true, camera: true, screenShare: false, leave: true }}
        />
      </div>

      {/* Suppress unused warning */}
      <span className="hidden">{participants.length} {displayName}</span>
    </div>
  )
}
