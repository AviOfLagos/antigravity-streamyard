"use client"

import { useCallback, useEffect, useRef } from "react"

import { type ToggleSource } from "@livekit/components-core"
import { useLocalParticipant, useParticipants, useTracks, useTrackToggle } from "@livekit/components-react"
import { LogOut, Mic, MicOff, Video, VideoOff, Zap } from "lucide-react"
import { Track } from "livekit-client"

import { LocalAudioLevel } from "@/components/studio/AudioLevelIndicator"
import ChatPanel from "@/components/chat/ChatPanel"
import DeviceSelector from "@/components/studio/DeviceSelector"
import VideoTile from "@/components/studio/VideoTile"
import type { SSEEventData } from "@/lib/chat/types"
import { SSEEventDataSchema } from "@/lib/schemas/sse"
import { useChatStore } from "@/store/chat"

interface GuestStudioProps {
  roomCode: string
  displayName: string
}

function GuestTrackButton({
  source,
  onIcon,
  offIcon,
  onLabel,
  offLabel,
}: {
  source: ToggleSource
  onIcon: React.ReactNode
  offIcon: React.ReactNode
  onLabel: string
  offLabel: string
}) {
  const { buttonProps, enabled } = useTrackToggle({ source })
  return (
    <button
      {...buttonProps}
      type="button"
      className={[
        "flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all text-[11px] font-medium min-w-15 select-none",
        enabled
          ? "bg-white/6 text-gray-300 hover:bg-white/10 hover:text-white"
          : "bg-red-500/10 text-red-400 hover:bg-red-500/20",
      ].join(" ")}
    >
      <span className="w-5 h-5 flex items-center justify-center">
        {enabled ? onIcon : offIcon}
      </span>
      <span>{enabled ? onLabel : offLabel}</span>
    </button>
  )
}

export default function GuestStudio({ roomCode, displayName }: GuestStudioProps) {
  const { localParticipant } = useLocalParticipant()

  const handleLeave = async () => {
    try {
      await fetch(`/api/rooms/${roomCode}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, identity: localParticipant.identity }),
      })
    } catch { /* best-effort */ }
    window.location.href = "/studio-ended"
  }

  const participants = useParticipants()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const addMessage = useChatStore((s) => s.addMessage)
  const sseRef = useRef<EventSource | null>(null)

  const handleSSEEvent = useCallback(
    (event: SSEEventData) => {
      if (event.type === "CHAT_MESSAGE") addMessage(event.data)
      if (event.type === "STUDIO_ENDED") window.location.href = "/studio-ended"
    },
    [addMessage]
  )

  useEffect(() => {
    const since = Date.now() - 1000
    const es = new EventSource(`/api/rooms/${roomCode}/stream?since=${since}`)
    sseRef.current = es
    es.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data)
        const parsed = SSEEventDataSchema.safeParse(raw)
        if (parsed.success) handleSSEEvent(parsed.data)
      } catch {}
    }
    return () => es.close()
  }, [roomCode, handleSSEEvent])

  const visibleTracks = tracks.filter(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  )

  function gridCols(n: number) {
    if (n <= 1) return "grid-cols-1"
    if (n <= 2) return "grid-cols-2"
    return "grid-cols-3"
  }

  return (
    <div className="flex flex-col h-dvh bg-[#0d0d0d] overflow-hidden">
      {/* Header */}
      <header className="flex-none h-12 flex items-center px-4 bg-[#080808] border-b border-white/6 gap-2.5">
        <div className="flex items-center gap-1.5 text-white font-bold text-sm">
          <Zap className="w-4 h-4 text-violet-400" />
          Zerocast
        </div>
        <div className="h-4 w-px bg-white/10" />
        <span className="font-mono text-[11px] text-gray-500 tracking-widest uppercase">
          {roomCode}
        </span>
        <span className="ml-auto text-xs text-gray-600">
          {participants.length} in room · {displayName}
        </span>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video grid */}
        <div className={`flex-1 grid ${gridCols(visibleTracks.length)} gap-2 p-3 content-center`}>
          {visibleTracks.map((trackRef) => (
            <VideoTile
              key={`${trackRef.participant.identity}-${trackRef.source}`}
              trackRef={trackRef}
              isVisible={true}
              isLocal={trackRef.participant.isLocal}
              isHost={false}
            />
          ))}
          {visibleTracks.length === 0 && (
            <div className="aspect-video flex items-center justify-center">
              <p className="text-gray-600 text-sm">Waiting for video…</p>
            </div>
          )}
        </div>

        {/* Chat — hidden on small screens */}
        <div className="hidden lg:flex flex-col w-72 border-l border-white/6">
          <ChatPanel roomCode={roomCode} isHost={false} />
        </div>
      </div>

      {/* Guest controls */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-[#080808] border-t border-white/6">
        <div className="flex items-center gap-2">
          <GuestTrackButton
            source={Track.Source.Microphone}
            onIcon={<Mic className="w-5 h-5" />}
            offIcon={<MicOff className="w-5 h-5" />}
            onLabel="Mic"
            offLabel="Muted"
          />
          {/* Live audio level — confirms mic is working */}
          <LocalAudioLevel barCount={5} />
          <GuestTrackButton
            source={Track.Source.Camera}
            onIcon={<Video className="w-5 h-5" />}
            offIcon={<VideoOff className="w-5 h-5" />}
            onLabel="Camera"
            offLabel="Cam off"
          />
        </div>

        {/* Device selectors — mic, camera, speaker (hidden on small screens) */}
        <div className="hidden md:flex items-center">
          <DeviceSelector />
        </div>

        <button
          type="button"
          onClick={handleLeave}
          className="flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl text-[11px] font-medium min-w-15 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all select-none"
        >
          <LogOut className="w-5 h-5" />
          <span>Leave</span>
        </button>
      </div>
    </div>
  )
}
