"use client"

import { useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"

import BackstagePanel from "./BackstagePanel"
import CompositeStage from "./CompositeStage"

interface VideoGridProps {
  roomCode: string
  isHost?: boolean
  hostToken?: string
}

export default function VideoGrid({ roomCode, isHost, hostToken }: VideoGridProps) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[1280px] mx-auto px-3 py-3 h-full flex flex-col justify-center">
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <div className="absolute inset-0">
              <CompositeStage tracks={tracks} isHost={isHost} />
            </div>
          </div>
        </div>
      </div>
      <BackstagePanel isHost={isHost} roomCode={roomCode} hostToken={hostToken} />
    </div>
  )
}
