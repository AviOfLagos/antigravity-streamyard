"use client"

import { useState } from "react"
import { TrackToggle } from "@livekit/components-react"
import { LogOut } from "lucide-react"
import { Track } from "livekit-client"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

import InviteLink from "./InviteLink"

interface ControlBarProps {
  roomCode: string
}

export default function ControlBar({ roomCode }: ControlBarProps) {
  const router = useRouter()
  const [ending, setEnding] = useState(false)

  const handleEndStudio = async () => {
    if (!confirm("End this studio session for everyone?")) return
    setEnding(true)
    try {
      await fetch(`/api/rooms/${roomCode}/end`, { method: "POST" })
      router.push("/dashboard")
    } finally {
      setEnding(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900">
      {/* Left: media controls */}
      <div className="flex items-center gap-2">
        <TrackToggle
          source={Track.Source.Microphone}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors data-[pressed=true]:bg-red-900 data-[pressed=true]:text-red-300"
        >
          Mic
        </TrackToggle>
        <TrackToggle
          source={Track.Source.Camera}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors data-[pressed=true]:bg-red-900 data-[pressed=true]:text-red-300"
        >
          Camera
        </TrackToggle>
        <TrackToggle
          source={Track.Source.ScreenShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium transition-colors data-[pressed=true]:bg-blue-900 data-[pressed=true]:text-blue-300"
        >
          Share Screen
        </TrackToggle>
      </div>

      {/* Center: invite link */}
      <InviteLink roomCode={roomCode} />

      {/* Right: end studio */}
      <Button
        onClick={handleEndStudio}
        disabled={ending}
        variant="destructive"
        size="sm"
        className="bg-red-600 hover:bg-red-700"
      >
        <LogOut className="w-4 h-4 mr-1.5" />
        {ending ? "Ending..." : "End Studio"}
      </Button>
    </div>
  )
}
