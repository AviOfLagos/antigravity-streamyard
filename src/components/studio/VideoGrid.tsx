"use client"

import { useParticipants, useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"

import { useStudioStore } from "@/store/studio"

import VideoTile from "./VideoTile"

interface VideoGridProps {
  roomCode: string
}

export default function VideoGrid({ roomCode: _roomCode }: VideoGridProps) {
  const participants = useParticipants()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const { onScreen } = useStudioStore()

  const getGridClass = (count: number) => {
    if (count <= 1) return "grid-cols-1"
    if (count <= 2) return "grid-cols-2"
    if (count <= 4) return "grid-cols-2"
    return "grid-cols-3"
  }

  const gridClass = getGridClass(participants.length)

  return (
    <div className={`grid ${gridClass} gap-2 p-4 h-full content-center`}>
      {tracks
        .filter((t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare)
        .map((trackRef) => {
          const participantId = trackRef.participant.identity
          const isVisible = onScreen[participantId] !== false

          return (
            <VideoTile
              key={`${participantId}-${trackRef.source}`}
              trackRef={trackRef}
              isVisible={isVisible}
              isLocal={trackRef.participant.isLocal}
            />
          )
        })}
    </div>
  )
}
