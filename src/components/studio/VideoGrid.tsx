"use client"

import { useMemo } from "react"

import { useParticipants, useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"

import { useStudioStore } from "@/store/studio"

import BackstagePanel from "./BackstagePanel"
import ChatOverlay from "./ChatOverlay"
import TextOverlayRenderer from "./TextOverlayRenderer"
import VideoTile from "./VideoTile"

interface VideoGridProps {
  roomCode: string
  isHost?: boolean
  hostToken?: string
}

function gridCols(count: number) {
  if (count === 1) return "grid-cols-1"
  if (count <= 4) return "grid-cols-2"
  return "grid-cols-3"
}

export default function VideoGrid({ roomCode, isHost, hostToken }: VideoGridProps) {
  const participants = useParticipants()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const onScreenParticipantIds = useStudioStore((s) => s.onScreenParticipantIds)
  const activeLayout = useStudioStore((s) => s.activeLayout)
  const pinnedParticipantId = useStudioStore((s) => s.pinnedParticipantId)
  const textOverlays = useStudioStore((s) => s.textOverlays)
  const stageBackground = useStudioStore((s) => s.stageBackground)
  const chatOverlayEnabled = useStudioStore((s) => s.chatOverlayEnabled)
  const chatOverlayPosition = useStudioStore((s) => s.chatOverlayPosition)

  // Memoize track filtering chains
  const { stageTracks, screenshareTracks, cameraTracks } = useMemo(() => {
    const allTracks = tracks.filter(
      (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
    )

    const stage =
      onScreenParticipantIds.length === 0
        ? allTracks
        : allTracks.filter((t) => onScreenParticipantIds.includes(t.participant.identity))

    const screenshare = stage.filter((t) => t.source === Track.Source.ScreenShare)
    const camera = stage.filter((t) => t.source === Track.Source.Camera)

    return { stageTracks: stage, screenshareTracks: screenshare, cameraTracks: camera }
  }, [tracks, onScreenParticipantIds])

  const pinnedTrack =
    pinnedParticipantId != null
      ? stageTracks.find((t) => t.participant.identity === pinnedParticipantId)
      : null
  const primaryTrack = pinnedTrack ?? stageTracks[0]
  const sidebarTracks = stageTracks.filter((t) => t !== primaryTrack)

  void participants

  const renderTile = (trackRef: (typeof stageTracks)[number]) => (
    <VideoTile
      key={`${trackRef.participant.identity}-${trackRef.source}`}
      trackRef={trackRef}
      isVisible={true}
      isLocal={trackRef.participant.isLocal}
      isHost={isHost}
    />
  )

  let stageContent: React.ReactNode

  if (activeLayout === "spotlight" && stageTracks.length > 0) {
    stageContent = (
      <div className="flex gap-2 h-full">
        <div className="flex-3 min-w-0">
          {primaryTrack && renderTile(primaryTrack)}
        </div>
        {sidebarTracks.length > 0 && (
          <div className="flex flex-col gap-2 flex-1 min-w-0 overflow-y-auto">
            {sidebarTracks.map((t) => renderTile(t))}
          </div>
        )}
      </div>
    )
  } else if (activeLayout === "screen-grid") {
    const hasScreenshare = screenshareTracks.length > 0
    stageContent = (
      <div className="flex flex-col gap-2 h-full">
        <div className="flex-3 min-h-0">
          {hasScreenshare ? (
            <div className="flex gap-2 h-full">
              {screenshareTracks.map((t) => renderTile(t))}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-600 text-sm">No screenshare active</p>
            </div>
          )}
        </div>
        {cameraTracks.length > 0 && (
          <div className="flex-1 flex gap-2 min-h-0">
            {cameraTracks.map((t) => renderTile(t))}
          </div>
        )}
      </div>
    )
  } else if (activeLayout === "screen-only") {
    stageContent =
      screenshareTracks.length > 0 ? (
        <div className="flex gap-2 h-full">
          {screenshareTracks.map((t) => renderTile(t))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-600 text-sm">No screenshare active</p>
        </div>
      )
  } else if (activeLayout === "single") {
    stageContent = primaryTrack ? (
      renderTile(primaryTrack)
    ) : (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-600 text-sm">No participant selected</p>
      </div>
    )
  } else {
    stageContent =
      stageTracks.length > 0 ? (
        <div className={`grid ${gridCols(stageTracks.length)} gap-2 h-full content-center`}>
          {stageTracks.map((t) => renderTile(t))}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center">
          <p className="text-gray-600 text-sm">No participants on screen</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: stageBackground }}>
      {/* Main stage — max-width centered, 16:9 aspect ratio */}
      <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[1280px] mx-auto px-3 py-3 h-full flex flex-col justify-center">
          {/* 16:9 stage container: width-constrained, aspect-ratio enforced */}
          <div className="relative w-full transition-all duration-500 ease-in-out" style={{ aspectRatio: "16/9" }}>
            <div className="absolute inset-0">
              {stageContent}
              <TextOverlayRenderer overlays={textOverlays} />
              {chatOverlayEnabled && <ChatOverlay position={chatOverlayPosition} />}
            </div>
          </div>
        </div>
      </div>

      {/* Backstage strip (host only) */}
      <BackstagePanel isHost={isHost} roomCode={roomCode} hostToken={hostToken} />
    </div>
  )
}
