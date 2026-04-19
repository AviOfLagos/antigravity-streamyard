"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import { LiveKitRoom, RoomAudioRenderer, useConnectionState } from "@livekit/components-react"
import { MessageSquare, X, Zap } from "lucide-react"
import { ConnectionState } from "livekit-client"
import { toast } from "sonner"

import ChatPanel from "@/components/chat/ChatPanel"
import { PLATFORM_COLORS } from "@/components/chat/PlatformBadge"
import ConnectionStatus from "@/components/studio/ConnectionStatus"
import ControlBar from "@/components/studio/ControlBar"
import GuestRequestToast from "@/components/studio/GuestRequestToast"
import VideoGrid from "@/components/studio/VideoGrid"
import { SSEEventDataSchema } from "@/lib/schemas/sse"
import { PlatformListResponseSchema } from "@/lib/schemas/platform"
import type { SSEEventData } from "@/lib/chat/types"
import { useChatStore } from "@/store/chat"
import { useStudioStore } from "@/store/studio"

interface StudioClientProps {
  roomCode: string
  hostToken: string
  livekitUrl: string
  title?: string
  connectedPlatforms?: { platform: string; channelName: string }[]
}

function ConnectionMonitor() {
  const state = useConnectionState()
  const prevStateRef = useRef<ConnectionState>(ConnectionState.Connecting)

  // F-12: Show "Reconnected" toast when connection recovers from a lost state
  useEffect(() => {
    const prev = prevStateRef.current
    if (
      state === ConnectionState.Connected &&
      (prev === ConnectionState.Reconnecting || prev === ConnectionState.Disconnected)
    ) {
      toast.success("Reconnected", {
        description: "Connection to the studio has been restored.",
        duration: 3000,
      })
    }
    prevStateRef.current = state
  }, [state])

  if (state === ConnectionState.Connecting) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-20 pointer-events-none">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-white text-sm">Connecting to studio...</p>
        </div>
      </div>
    )
  }
  if (state === ConnectionState.Reconnecting || state === ConnectionState.Disconnected) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20 pointer-events-none">
        <div className="text-center">
          <p className="text-white font-semibold mb-1">Connection lost</p>
          <p className="text-gray-300 text-sm">Attempting to reconnect...</p>
        </div>
      </div>
    )
  }
  return null
}

function LiveBadge() {
  const isLive = useStudioStore((s) => s.isLive)
  if (!isLive) return null

  return (
    <span className="inline-flex items-center gap-1.5 bg-red-500/15 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500" />
      </span>
      LIVE
    </span>
  )
}

export default function StudioClient({ roomCode, hostToken, livekitUrl, title, connectedPlatforms: initialPlatforms }: StudioClientProps) {
  const addPendingGuest = useStudioStore((s) => s.addPendingGuest)
  const removePendingGuest = useStudioStore((s) => s.removePendingGuest)
  const hydrateFromSaved = useStudioStore((s) => s.hydrateFromSaved)
  const setLiveState = useStudioStore((s) => s.setLiveState)
  const addStreamPlatform = useStudioStore((s) => s.addStreamPlatform)
  const removeStreamPlatform = useStudioStore((s) => s.removeStreamPlatform)
  const addMessage = useChatStore((s) => s.addMessage)
  const hydrateFilters = useChatStore((s) => s.hydrateFilters)
  const sseRef = useRef<EventSource | null>(null)
  const startedConnectors = useRef(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [sseOk, setSseOk] = useState(true)
  const [connectedPlatforms, setConnectedPlatforms] = useState<{ platform: string; channelName: string }[]>(initialPlatforms ?? [])

  // F-11: Hydrate studio state from Redis on mount
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    fetch(`/api/rooms/${roomCode}/state`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.state) {
          const s = data.state as Record<string, unknown>
          if (s.activeLayout || s.pinnedParticipantId !== undefined || s.onScreenParticipantIds) {
            hydrateFromSaved({
              activeLayout: s.activeLayout as Parameters<typeof hydrateFromSaved>[0]["activeLayout"],
              pinnedParticipantId: (s.pinnedParticipantId as string | null) ?? null,
              onScreenParticipantIds: (s.onScreenParticipantIds as string[]) ?? undefined,
            })
          }
          if (s.filters) {
            hydrateFilters(s.filters as Parameters<typeof hydrateFilters>[0])
          }
        }
      })
      .catch(() => {/* Redis unavailable -- use defaults */})
  }, [roomCode, hydrateFromSaved, hydrateFilters])

  // F-11: Debounced save of studio + chat filter state to Redis
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const unsubStudio = useStudioStore.subscribe((state) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const chatFilters = useChatStore.getState().filters
        fetch(`/api/rooms/${roomCode}/state`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activeLayout: state.activeLayout,
            pinnedParticipantId: state.pinnedParticipantId,
            onScreenParticipantIds: state.onScreenParticipantIds,
            filters: chatFilters,
          }),
        }).catch(() => {/* save failed -- non-critical */})
      }, 500)
    })

    const unsubChat = useChatStore.subscribe((state, prev) => {
      // Only save when filters change, not on every message
      if (state.filters === prev.filters) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        const studioState = useStudioStore.getState()
        fetch(`/api/rooms/${roomCode}/state`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activeLayout: studioState.activeLayout,
            pinnedParticipantId: studioState.pinnedParticipantId,
            onScreenParticipantIds: studioState.onScreenParticipantIds,
            filters: state.filters,
          }),
        }).catch(() => {/* save failed -- non-critical */})
      }, 500)
    })

    return () => {
      unsubStudio()
      unsubChat()
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [roomCode])

  // SSE event handler with streaming event support
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
      case "CHAT_CONNECTOR_STATUS":
        console.info(`[ConnectorStatus] ${event.data.platform}: ${event.data.status}${event.data.error ? ` -- ${event.data.error}` : ""}`)
        break
      case "CONNECTION_ERROR":
        setSseOk(false)
        break
      case "STUDIO_ENDED":
        window.location.href = "/dashboard"
        break
      // Streaming SSE events
      case "STREAM_STARTED":
        setLiveState(true, event.data.egressId, event.data.platforms, new Date())
        toast.success("Stream started", { description: `Now live on ${event.data.platforms.length} platform(s).` })
        break
      case "STREAM_STOPPED":
        setLiveState(false)
        toast.info("Stream ended")
        break
      case "STREAM_DESTINATION_CHANGED":
        if (event.data.action === "add") {
          addStreamPlatform(event.data.platform)
          toast.success(`Added ${event.data.platform} to stream`)
        } else {
          removeStreamPlatform(event.data.platform)
          toast.info(`Removed ${event.data.platform} from stream`)
        }
        break
      case "STREAM_ERROR":
        toast.error("Stream error", {
          description: `${event.data.platform ? `[${event.data.platform}] ` : ""}${event.data.error}`,
        })
        break
    }
  }, [addPendingGuest, removePendingGuest, addMessage, setLiveState, addStreamPlatform, removeStreamPlatform])

  // F-03: Ref-based callback for stable SSE handler identity (no dependency churn)
  const handleSSEEventRef = useRef<(event: SSEEventData) => void>(handleSSEEvent)
  handleSSEEventRef.current = handleSSEEvent

  // F-03: Deduplicate SSE messages by _ts timestamp
  const lastEventTsRef = useRef<number>(0)

  // Only fetch platforms client-side if not provided server-side
  useEffect(() => {
    if (initialPlatforms && initialPlatforms.length > 0) return
    fetch(`/api/rooms/${roomCode}/platforms`)
      .then((r) => r.json())
      .then((data) => {
        const parsed = PlatformListResponseSchema.safeParse(data)
        if (parsed.success) setConnectedPlatforms(parsed.data.platforms)
        else if (Array.isArray(data.platforms)) setConnectedPlatforms(data.platforms)
      })
      .catch(() => {/* silently ignore -- indicator is non-critical */})
  }, [roomCode, initialPlatforms])

  // F-03: SSE connection with ref-based EventSource, stable handler, dedup, PING filtering
  useEffect(() => {
    // Close any previous connection (handles React StrictMode double-mount)
    if (sseRef.current) {
      sseRef.current.close()
      sseRef.current = null
    }

    const since = Date.now() - 1000
    const es = new EventSource(`/api/rooms/${roomCode}/stream?since=${since}`)
    sseRef.current = es

    es.onmessage = (e) => {
      // F-03: Only update sseOk when transitioning from false to true
      setSseOk((prev) => {
        if (prev) return prev
        return true
      })

      try {
        const raw = JSON.parse(e.data)

        // F-03: Filter PING events before triggering any React state updates
        if (raw.type === "PING") return

        // F-03: Deduplicate by _ts timestamp
        if (raw._ts && typeof raw._ts === "number") {
          if (raw._ts <= lastEventTsRef.current) return
          lastEventTsRef.current = raw._ts
        }

        const parsed = SSEEventDataSchema.safeParse(raw)
        if (parsed.success) handleSSEEventRef.current(parsed.data)
      } catch {
        // Ignore malformed SSE data
      }
    }

    es.onerror = () => setSseOk(false)

    if (!startedConnectors.current) {
      startedConnectors.current = true
      fetch(`/api/rooms/${roomCode}/chat/connect`, { method: "POST" }).catch(console.error)
    }

    return () => {
      es.close()
      sseRef.current = null
    }
  }, [roomCode]) // F-03: No dependency on handleSSEEvent -- uses ref pattern instead

  // G17 -- guard against undefined livekitUrl (after all hooks)
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
      {/* Fixed overlay toasts -- pass hostToken for demo/direct-access auth */}
      <GuestRequestToast roomCode={roomCode} hostToken={hostToken} />

      {/* Header */}
      <header className="flex-none h-12 flex items-center justify-between px-4 bg-[#080808] border-b border-white/6 z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-white font-bold text-sm">
            <Zap className="w-4 h-4 text-violet-400" />
            Zerocast
          </div>
          <div className="h-4 w-px bg-white/10" />
          {title ? (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white leading-tight">{title}</span>
              <span className="font-mono text-[9px] text-gray-600 tracking-widest uppercase">{roomCode}</span>
            </div>
          ) : (
            <span className="font-mono text-[11px] text-gray-500 tracking-widest uppercase">{roomCode}</span>
          )}
          {/* LIVE badge in header when streaming */}
          <LiveBadge />
          {connectedPlatforms.length > 0 && (
            <div className="flex items-center gap-1">
              {connectedPlatforms.map((p) => (
                <span
                  key={p.platform}
                  title={`${p.platform}: ${p.channelName}`}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: (PLATFORM_COLORS as Record<string, string>)[p.platform] ?? "#6b7280" }}
                />
              ))}
            </div>
          )}
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
      >
        {/* Render remote participants' audio */}
        <RoomAudioRenderer />
        {/* Stage: video + controls */}
        <div className="relative flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* F-12: Connection status indicator inside LiveKitRoom context */}
          <ConnectionStatus />
          <div className="flex-1 overflow-hidden">
            <VideoGrid roomCode={roomCode} isHost={true} />
          </div>
          {/* ControlBar is now inside LiveKitRoom -- TrackToggle hooks work here */}
          <ControlBar roomCode={roomCode} connectedPlatforms={connectedPlatforms} />

          {/* G35 -- LiveKit connection state overlay */}
          <ConnectionMonitor />
        </div>

        {/* Chat panel -- slide in from right on mobile */}
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

      {/* G13 -- SSE connection error banner */}
      {!sseOk && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-red-500/15 border border-red-500/20 text-red-300 text-xs px-4 py-2 rounded-full z-50">
          Connection interrupted -- events may be delayed
        </div>
      )}
    </div>
  )
}
