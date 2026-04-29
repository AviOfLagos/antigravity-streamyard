"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { type ToggleSource } from "@livekit/components-core"
import { useLocalParticipant, useParticipants, useTracks, useTrackToggle } from "@livekit/components-react"
import { LogOut, MessageSquare, Mic, MicOff, Video, VideoOff, X, Zap } from "lucide-react"
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
  // chatOpen: mobile overlay toggle (< lg screens)
  const [chatOpen, setChatOpen] = useState(false)
  // chatCollapsed: desktop sidebar collapse (lg+ screens)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  // unreadCount: messages received while desktop chat is collapsed
  const [unreadCount, setUnreadCount] = useState(0)

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

  // Ref to read chatCollapsed inside SSE handler without stale closure
  const chatCollapsedRef = useRef(chatCollapsed)
  useEffect(() => { chatCollapsedRef.current = chatCollapsed }, [chatCollapsed])

  const handleSSEEvent = useCallback(
    (event: SSEEventData) => {
      if (event.type === "CHAT_MESSAGE") {
        addMessage(event.data)
        // Count unread messages when desktop chat sidebar is collapsed
        if (chatCollapsedRef.current) {
          setUnreadCount((n) => n + 1)
        }
      }
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
        <span className="text-xs text-gray-600">
          {participants.length} in room · {displayName}
        </span>
        {/* Chat toggle: always on mobile; on desktop only when collapsed */}
        <button
          type="button"
          className={[
            "ml-auto relative p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/6 transition-colors",
            chatCollapsed ? "flex" : "flex lg:hidden",
          ].join(" ")}
          onClick={() => {
            if (chatCollapsed) {
              setChatCollapsed(false)
              setUnreadCount(0)
            } else {
              setChatOpen((o) => {
                if (!o) setUnreadCount(0)
                return !o
              })
            }
          }}
          aria-label="Toggle chat"
        >
          {(chatOpen && !chatCollapsed) ? <X className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
          {unreadCount > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[8px] font-bold rounded-full px-0.5 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Main */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Video grid — always fills available space, never obscured by chat */}
        <div className={`flex-1 grid ${gridCols(visibleTracks.length)} gap-2 p-3 content-center min-w-0`}>
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

        {/* Chat panel — desktop: collapsible sidebar; mobile: absolute overlay */}
        <div
          className={[
            "flex-col border-l border-white/6 bg-[#0d0d0d] transition-all duration-200",
            chatCollapsed ? "lg:hidden" : "lg:flex lg:w-72",
            chatOpen
              ? "flex absolute right-0 top-0 bottom-0 w-full sm:w-80 z-30 shadow-2xl"
              : "hidden",
          ].join(" ")}
        >
          <ChatPanel
            roomCode={roomCode}
            isHost={false}
            connectedPlatforms={[]}
            onCollapse={() => {
              setChatCollapsed(true)
              setChatOpen(false)
              setUnreadCount(0)
            }}
            collapsed={chatCollapsed}
          />
        </div>

        {/* Floating badge — desktop only, shown when chat sidebar is collapsed */}
        {chatCollapsed && (
          <button
            type="button"
            onClick={() => {
              setChatCollapsed(false)
              setUnreadCount(0)
            }}
            className="hidden lg:flex absolute top-3 right-3 z-40 items-center justify-center w-10 h-10 bg-violet-500 hover:bg-violet-400 text-white rounded-full shadow-lg transition-all duration-200"
            aria-label="Open chat"
            title="Open chat"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 leading-none">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Guest controls — always visible at bottom */}
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
