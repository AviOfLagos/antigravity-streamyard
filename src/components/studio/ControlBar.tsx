"use client"

import { useEffect, useRef, useState } from "react"

import { type ToggleSource } from "@livekit/components-core"
import { useTrackToggle } from "@livekit/components-react"
import { AlertTriangle, Loader2, LogOut, Mic, MicOff, Monitor, MonitorOff, Radio, Type, Video, VideoOff } from "lucide-react"
import { Track } from "livekit-client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStudioStore } from "@/store/studio"

import { LocalAudioLevel } from "./AudioLevelIndicator"
import DeviceSelector from "./DeviceSelector"
import GoLivePanel from "./GoLivePanel"
import InviteLink from "./InviteLink"
import LayoutSelector from "./LayoutSelector"
import TextOverlayPanel from "./TextOverlayPanel"

interface TrackButtonProps {
  source: ToggleSource
  onIcon: React.ReactNode
  offIcon: React.ReactNode
  onLabel: string
  offLabel: string
}

function TrackButton({ source, onIcon, offIcon, onLabel, offLabel }: TrackButtonProps) {
  const { buttonProps, enabled } = useTrackToggle({ source })
  return (
    <button
      {...buttonProps}
      type="button"
      className={[
        "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-[11px] font-medium min-w-15 select-none",
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

// ── Styled checkbox row ────────────────────────────────────────────────────

interface CheckRowProps {
  id: string
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange?: (v: boolean) => void
}

function CheckRow({ id, label, description, checked, disabled = false, onChange }: CheckRowProps) {
  return (
    <label
      htmlFor={id}
      className={[
        "flex items-start gap-3 rounded-lg border p-3 transition-colors select-none",
        disabled
          ? "border-white/6 opacity-50 cursor-not-allowed"
          : "border-white/6 hover:border-white/12 cursor-pointer",
      ].join(" ")}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border border-white/20 bg-white/6 accent-red-500 cursor-pointer disabled:cursor-not-allowed"
      />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-gray-100">{label}</span>
        <span className="text-xs text-gray-500">{description}</span>
      </div>
    </label>
  )
}

interface ControlBarProps {
  roomCode: string
  connectedPlatforms?: { platform: string; channelName: string }[]
  streamTitle?: string
  streamDescription?: string
}

// ── Elapsed timer hook ────────────────────────────────────────────────────

function useElapsedTime(startedAt: Date | null): string {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0)
      return
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [startedAt])

  const m = Math.floor(elapsed / 60).toString().padStart(2, "0")
  const s = (elapsed % 60).toString().padStart(2, "0")
  return `${m}:${s}`
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ControlBar({ roomCode, connectedPlatforms = [], streamTitle, streamDescription }: ControlBarProps) {
  const router = useRouter()
  const { isLive, streamPlatforms, textOverlays, isRecording, recordingEgressId, recordingStartedAt, setRecordingState } = useStudioStore()

  const [open, setOpen] = useState(false)
  const [ending, setEnding] = useState(false)
  const [stopStreams, setStopStreams] = useState(true)
  const [kickParticipants, setKickParticipants] = useState(true)
  const [textPanelOpen, setTextPanelOpen] = useState(false)
  const textPanelRef = useRef<HTMLDivElement>(null)
  const textButtonRef = useRef<HTMLButtonElement>(null)
  const [recordBusy, setRecordBusy] = useState(false)
  const recElapsed = useElapsedTime(recordingStartedAt)

  // Close text panel on outside click
  useEffect(() => {
    if (!textPanelOpen) return
    const handleClick = (e: MouseEvent) => {
      if (
        textPanelRef.current && !textPanelRef.current.contains(e.target as Node) &&
        textButtonRef.current && !textButtonRef.current.contains(e.target as Node)
      ) {
        setTextPanelOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [textPanelOpen])

  // Count visible overlays for badge
  const visibleOverlayCount = textOverlays.filter((o) => o.visible).length

  const handleEnd = async () => {
    setEnding(true)
    try {
      await fetch(`/api/rooms/${roomCode}/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stopStreams: isLive ? stopStreams : false, kickParticipants }),
      })
      router.push(`/session-summary/${roomCode}`)
    } finally {
      setEnding(false)
      setOpen(false)
    }
  }

  const handleToggleRecord = async () => {
    if (recordBusy) return
    setRecordBusy(true)
    try {
      if (isRecording && recordingEgressId) {
        // Stop recording
        const res = await fetch(`/api/rooms/${roomCode}/record`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ egressId: recordingEgressId }),
        })
        if (res.ok) {
          setRecordingState(false, null, null)
        } else {
          const data = await res.json().catch(() => ({}))
          console.error("[ControlBar] Stop recording failed:", data)
        }
      } else {
        // Start recording
        const res = await fetch(`/api/rooms/${roomCode}/record`, { method: "POST" })
        if (res.ok) {
          const data = await res.json()
          setRecordingState(true, data.egressId, new Date())
        } else {
          const data = await res.json().catch(() => ({}))
          console.error("[ControlBar] Start recording failed:", data)
        }
      }
    } finally {
      setRecordBusy(false)
    }
  }

  // Format platform names for display
  const platformLabel = streamPlatforms.length > 0
    ? streamPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(", ")
    : null

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#080808] border-t border-white/6 gap-3">
      {/* Left: track controls */}
      <div className="flex items-center gap-1.5">
        <TrackButton
          source={Track.Source.Microphone}
          onIcon={<Mic className="w-5 h-5" />}
          offIcon={<MicOff className="w-5 h-5" />}
          onLabel="Mic"
          offLabel="Muted"
        />
        {/* Live audio level — confirms mic is active */}
        <LocalAudioLevel barCount={5} />
        <TrackButton
          source={Track.Source.Camera}
          onIcon={<Video className="w-5 h-5" />}
          offIcon={<VideoOff className="w-5 h-5" />}
          onLabel="Camera"
          offLabel="Cam off"
        />
        <TrackButton
          source={Track.Source.ScreenShare}
          onIcon={<Monitor className="w-5 h-5" />}
          offIcon={<MonitorOff className="w-5 h-5" />}
          onLabel="Screen"
          offLabel="Screen"
        />
      </div>

      {/* Record button */}
      <button
        type="button"
        onClick={handleToggleRecord}
        disabled={recordBusy}
        className={[
          "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-[11px] font-medium min-w-15 select-none disabled:opacity-50",
          isRecording
            ? "bg-red-500/15 text-red-400 hover:bg-red-500/25"
            : "bg-white/6 text-gray-300 hover:bg-white/10 hover:text-white",
        ].join(" ")}
        title={isRecording ? "Stop recording" : "Start recording"}
      >
        <span className="w-5 h-5 flex items-center justify-center">
          {isRecording ? (
            /* Pulsing red filled circle */
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
            </span>
          ) : (
            /* Outlined circle */
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="10" cy="10" r="7" />
              <circle cx="10" cy="10" r="3.5" fill="currentColor" stroke="none" />
            </svg>
          )}
        </span>
        <span>{isRecording ? `REC ${recElapsed}` : "Record"}</span>
      </button>

      {/* Device selectors (hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <DeviceSelector />
      </div>

      {/* Center: invite link */}
      <div className="hidden sm:flex flex-1 justify-center">
        <InviteLink roomCode={roomCode} />
      </div>

      {/* Layout presets (hidden on mobile) */}
      <div className="hidden sm:block">
        <LayoutSelector />
      </div>

      {/* Text overlays button + panel */}
      <div className="relative hidden sm:block">
        <button
          ref={textButtonRef}
          type="button"
          onClick={() => setTextPanelOpen((o) => !o)}
          className={[
            "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-[11px] font-medium min-w-15 select-none relative",
            textPanelOpen
              ? "bg-violet-500/20 text-violet-300"
              : "bg-white/6 text-gray-300 hover:bg-white/10 hover:text-white",
          ].join(" ")}
          title="Text Overlays"
        >
          <span className="w-5 h-5 flex items-center justify-center relative">
            <Type className="w-4 h-4" />
            {visibleOverlayCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-violet-500 text-white text-[8px] font-bold rounded-full px-0.5 leading-none">
                {visibleOverlayCount}
              </span>
            )}
          </span>
          <span>Text</span>
        </button>

        {textPanelOpen && (
          <div
            ref={textPanelRef}
            className="absolute bottom-full mb-2 right-0 z-50"
          >
            <TextOverlayPanel />
          </div>
        )}
      </div>

      {/* Go Live / LIVE button */}
      <GoLivePanel roomCode={roomCode} connectedPlatforms={connectedPlatforms} streamTitle={streamTitle} streamDescription={streamDescription} />

      {/* Right: end studio — opens dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium min-w-15 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all select-none"
            >
              <LogOut className="w-5 h-5" />
              <span>End</span>
            </button>
          }
        />

        <DialogContent
          showCloseButton={!ending}
          className="bg-[#0d0d0d] border border-white/6 text-white sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-white">
              End Studio Session
            </DialogTitle>
            <DialogDescription className="text-gray-400 text-sm">
              Choose what happens when you end this studio.
            </DialogDescription>
          </DialogHeader>

          {/* Live stream warning banner */}
          {isLive && platformLabel && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/8 px-3 py-2.5">
              <Radio className="w-4 h-4 text-amber-400 mt-0.5 shrink-0 animate-pulse" />
              <p className="text-xs text-amber-300 leading-relaxed">
                Currently streaming to <span className="font-semibold">{platformLabel}</span>. Ending will stop all active streams.
              </p>
            </div>
          )}

          {/* Options */}
          <div className="flex flex-col gap-2">
            <CheckRow
              id="stop-streams"
              label="End live stream on all platforms"
              description={isLive ? "Stops the RTMP egress to all connected platforms." : "No active stream to stop."}
              checked={isLive ? stopStreams : false}
              disabled={!isLive}
              onChange={setStopStreams}
            />
            <CheckRow
              id="kick-participants"
              label="Remove all participants"
              description="Disconnects guests from the LiveKit room before closing."
              checked={kickParticipants}
              onChange={setKickParticipants}
            />
            <CheckRow
              id="end-session"
              label="End studio session"
              description="Always required — marks the room as ended and redirects you to the summary."
              checked
              disabled
            />
          </div>

          {/* Warning for destructive action */}
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-gray-600" />
            <span>This action cannot be undone. The studio will be permanently closed.</span>
          </div>

          <DialogFooter className="bg-transparent border-t border-white/6 gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={ending}
              className="flex-1 sm:flex-none h-8 px-4 rounded-lg border border-white/10 bg-white/4 text-sm text-gray-300 hover:bg-white/8 hover:text-white transition-colors disabled:opacity-40"
            >
              Cancel
            </button>
            <Button
              variant="destructive"
              onClick={handleEnd}
              disabled={ending}
              className="flex-1 sm:flex-none gap-2 bg-red-600/80 hover:bg-red-600 text-white border-red-500/30"
            >
              {ending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Ending…
                </>
              ) : (
                "End Studio"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
