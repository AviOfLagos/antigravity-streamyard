"use client"

import React, { useCallback, useMemo, useState } from "react"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Participant } from "livekit-client"
import { GripVertical, Mic, MicOff, Video, VideoOff, UserX } from "lucide-react"
import { toast } from "sonner"

import { useStudioStore } from "@/store/studio"

interface ParticipantRowProps {
  participant: Participant
  isOnStage: boolean
  roomCode: string
  hostToken?: string
}

const ParticipantRow = React.memo(function ParticipantRow({
  participant,
  isOnStage,
  roomCode,
  hostToken,
}: ParticipantRowProps) {
  const bringOnStage = useStudioStore((s) => s.bringOnStage)
  const sendToBackstage = useStudioStore((s) => s.sendToBackstage)
  const displayName = participant.name ?? participant.identity ?? "Guest"
  const initial = displayName.charAt(0).toUpperCase()
  const micOn = participant.isMicrophoneEnabled
  const camOn = participant.isCameraEnabled
  const isHost = participant.identity?.startsWith("host-")
  const [acting, setActing] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: participant.identity,
  })

  const authHeaders = useMemo<Record<string, string>>(() => ({
    "Content-Type": "application/json",
    ...(hostToken ? { Authorization: `Bearer ${hostToken}` } : {}),
  }), [hostToken])

  const handleStageToggle = useCallback(() => {
    if (isOnStage) {
      sendToBackstage(participant.identity)
    } else {
      bringOnStage(participant.identity)
    }
  }, [isOnStage, participant.identity, bringOnStage, sendToBackstage])

  const handleMuteMic = useCallback(async () => {
    if (isHost || acting) return
    setActing(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/mute`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          identity: participant.identity,
          trackType: "audio",
          muted: micOn, // toggle: if on → mute, if off → unmute
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to toggle mic")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setActing(false)
    }
  }, [roomCode, participant.identity, micOn, isHost, acting, authHeaders])

  const handleMuteCam = useCallback(async () => {
    if (isHost || acting) return
    setActing(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/mute`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          identity: participant.identity,
          trackType: "video",
          muted: camOn,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to toggle camera")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setActing(false)
    }
  }, [roomCode, participant.identity, camOn, isHost, acting, authHeaders])

  const handleKick = useCallback(async () => {
    if (isHost || acting) return
    if (!confirm(`Remove ${displayName} from the studio?`)) return
    setActing(true)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/kick`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ identity: participant.identity, name: displayName }),
      })
      if (res.ok) {
        sendToBackstage(participant.identity)
        toast.success(`${displayName} removed`)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? "Failed to remove participant")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setActing(false)
    }
  }, [roomCode, participant.identity, displayName, isHost, acting, authHeaders, sendToBackstage])

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="flex flex-col items-center gap-1 shrink-0 w-24 group relative"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Drag ${displayName} to reorder`}
        className="h-4 flex items-center justify-center text-gray-600 hover:text-white cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep rounded"
      >
        <GripVertical className="w-3 h-3" />
      </button>
      {/* Avatar */}
      <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white select-none shrink-0">
        {initial}
        {/* Mic dot */}
        <span
          className={[
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-studio-bg-deep",
            micOn ? "bg-emerald-400" : "bg-gray-600",
          ].join(" ")}
          title={micOn ? "Mic on" : "Mic off"}
        />
      </div>

      {/* Name */}
      <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">
        {displayName}
        {isHost && <span className="text-indigo-400 ml-0.5">★</span>}
      </span>

      {/* Moderation buttons (guests only) */}
      {!isHost && (
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleMuteMic}
            disabled={acting}
            aria-label={micOn ? `Mute ${displayName}'s mic` : `Unmute ${displayName}'s mic`}
            className={[
              "p-1.5 rounded transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep",
              micOn
                ? "text-emerald-400 hover:bg-emerald-500/15"
                : "text-gray-500 hover:bg-white/6",
            ].join(" ")}
            title={micOn ? "Mute mic" : "Unmute mic"}
          >
            {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleMuteCam}
            disabled={acting}
            aria-label={camOn ? `Turn off ${displayName}'s camera` : `Turn on ${displayName}'s camera`}
            className={[
              "p-1.5 rounded transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep",
              camOn
                ? "text-emerald-400 hover:bg-emerald-500/15"
                : "text-gray-500 hover:bg-white/6",
            ].join(" ")}
            title={camOn ? "Turn off camera" : "Turn on camera"}
          >
            {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleKick}
            disabled={acting}
            aria-label={`Remove ${displayName} from studio`}
            className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep"
            title="Remove from studio"
          >
            <UserX className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Show / Hide stage toggle — verb-only labels for clarity */}
      {isOnStage ? (
        <button
          type="button"
          onClick={handleStageToggle}
          aria-label={`Hide ${displayName} from stage`}
          className="bg-white/6 text-gray-300 hover:bg-white/10 hover:text-white px-3 py-1 min-h-[26px] rounded-md text-[11px] font-medium min-w-[68px] text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep"
        >
          Hide
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStageToggle}
          aria-label={`Show ${displayName} on stage`}
          className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 hover:text-indigo-200 px-3 py-1 min-h-[26px] rounded-md text-[11px] font-medium min-w-[68px] text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-1 focus-visible:ring-offset-studio-bg-deep"
        >
          Show
        </button>
      )}
    </div>
  )
})

export default ParticipantRow
