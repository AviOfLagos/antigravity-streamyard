"use client"

import { useState } from "react"

import { type ToggleSource } from "@livekit/components-core"
import { useTrackToggle } from "@livekit/components-react"
import { LogOut, Mic, MicOff, Monitor, MonitorOff, Video, VideoOff } from "lucide-react"
import { Track } from "livekit-client"
import { useRouter } from "next/navigation"

import DeviceSelector from "./DeviceSelector"
import GoLivePanel from "./GoLivePanel"
import InviteLink from "./InviteLink"
import LayoutSelector from "./LayoutSelector"

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

interface ControlBarProps {
  roomCode: string
  connectedPlatforms?: { platform: string; channelName: string }[]
  streamTitle?: string
  streamDescription?: string
}

export default function ControlBar({ roomCode, connectedPlatforms = [], streamTitle, streamDescription }: ControlBarProps) {
  const router = useRouter()
  const [ending, setEnding] = useState(false)

  const handleEnd = async () => {
    if (!confirm("End this studio for everyone?")) return
    setEnding(true)
    try {
      await fetch(`/api/rooms/${roomCode}/end`, { method: "POST" })
      router.push(`/session-summary/${roomCode}`)
    } finally {
      setEnding(false)
    }
  }

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

      {/* Device selectors (hidden on mobile) */}
      <div className="hidden md:flex items-center">
        <DeviceSelector />
      </div>

      {/* Center: invite link */}
      <div className="hidden sm:flex flex-1 justify-center">
        <InviteLink roomCode={roomCode} />
      </div>

      {/* Layout presets (hidden on mobile) */}
      <LayoutSelector />

      {/* Go Live / LIVE button */}
      <GoLivePanel roomCode={roomCode} connectedPlatforms={connectedPlatforms} streamTitle={streamTitle} streamDescription={streamDescription} />

      {/* Right: end studio */}
      <button
        type="button"
        onClick={handleEnd}
        disabled={ending}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[11px] font-medium min-w-15 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all disabled:opacity-40 select-none"
      >
        <LogOut className="w-5 h-5" />
        <span>{ending ? "Ending\u2026" : "End"}</span>
      </button>
    </div>
  )
}
