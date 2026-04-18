"use client"

import { useParticipants, useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"

import { useStudioStore } from "@/store/studio"

import BackstagePanel from "./BackstagePanel"
import VideoTile from "./VideoTile"

interface VideoGridProps {
  roomCode: string
  isHost?: boolean
}

function gridCols(count: number) {
  if (count === 1) return "grid-cols-1"
  if (count <= 4) return "grid-cols-2"
  return "grid-cols-3"
}

export default function VideoGrid({ roomCode: _roomCode, isHost }: VideoGridProps) {
  const participants = useParticipants()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const { onScreenParticipantIds, activeLayout, pinnedParticipantId } = useStudioStore()

  // Filter to camera and screenshare tracks only
  const allTracks = tracks.filter(
    (t) => t.source === Track.Source.Camera || t.source === Track.Source.ScreenShare
  )

  // When onScreenParticipantIds is empty, show everyone (backwards compat)
  const stageTracks =
    onScreenParticipantIds.length === 0
      ? allTracks
      : allTracks.filter((t) => onScreenParticipantIds.includes(t.participant.identity))

  const screenshareTracks = stageTracks.filter((t) => t.source === Track.Source.ScreenShare)
  const cameraTracks = stageTracks.filter((t) => t.source === Track.Source.Camera)

  // Determine pinned track for spotlight / single
  const pinnedTrack =
    pinnedParticipantId != null
      ? stageTracks.find((t) => t.participant.identity === pinnedParticipantId)
      : null
  const primaryTrack = pinnedTrack ?? stageTracks[0]
  const sidebarTracks = stageTracks.filter((t) => t !== primaryTrack)

  // Suppress unused warning for participants
  void participants

  // ── Render helpers ──────────────────────────────────────────────────────────

  const renderTile = (trackRef: (typeof stageTracks)[number]) => (
    <VideoTile
      key={`${trackRef.participant.identity}-${trackRef.source}`}
      trackRef={trackRef}
      isVisible={true}
      isLocal={trackRef.participant.isLocal}
      isHost={isHost}
    />
  )

  // ── Layout variants ──────────────────────────────────────────────────────────

  let stageContent: React.ReactNode

  if (activeLayout === "spotlight" && stageTracks.length > 0) {
    stageContent = (
      <div className="flex gap-2 h-full">
        {/* Primary: large */}
        <div className="flex-3 min-w-0">
          {primaryTrack && renderTile(primaryTrack)}
        </div>
        {/* Sidebar: stacked */}
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
        {/* Screenshare: fills most of height */}
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
        {/* Camera row at bottom */}
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
    // "grid" — default equal grid
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
    <div className="flex flex-col h-full bg-[#0d0d0d]">
      {/* Main stage */}
      <div className="flex-1 min-h-0 p-3">{stageContent}</div>

      {/* Backstage strip (host only) */}
      <BackstagePanel isHost={isHost} />
    </div>
  )
}
