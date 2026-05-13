"use client"

import { useMemo } from "react"

import { type TrackReferenceOrPlaceholder } from "@livekit/components-react"
import { Track } from "livekit-client"

import { LAYOUT_PRESETS } from "@/lib/layout/presets"
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/layout/types"
import { useStudioStore } from "@/store/studio"

import ChatOverlay from "./ChatOverlay"
import TextOverlayRenderer from "./TextOverlayRenderer"
import VideoTile from "./VideoTile"

interface CompositeStageProps {
  tracks: TrackReferenceOrPlaceholder[]
  isHost?: boolean
}

export default function CompositeStage({ tracks, isHost }: CompositeStageProps) {
  const activeLayout = useStudioStore((s) => s.activeLayout)
  const pinnedParticipantId = useStudioStore((s) => s.pinnedParticipantId)
  const onScreenParticipantIds = useStudioStore((s) => s.onScreenParticipantIds)
  const tileOrder = useStudioStore((s) => s.tileOrder)
  const textOverlays = useStudioStore((s) => s.textOverlays)
  const stageBackground = useStudioStore((s) => s.stageBackground)
  const chatOverlayEnabled = useStudioStore((s) => s.chatOverlayEnabled)
  const chatOverlayPosition = useStudioStore((s) => s.chatOverlayPosition)

  // Fallback guards against stale `activeLayout` values rehydrated from
  // older Redis snapshots whose preset id no longer exists in LAYOUT_PRESETS.
  const preset = LAYOUT_PRESETS[activeLayout] ?? LAYOUT_PRESETS["four-grid"]

  const slotAssignments = useMemo(() => {
    const stage =
      onScreenParticipantIds.length === 0
        ? tracks
        : tracks.filter((t) => onScreenParticipantIds.includes(t.participant.identity))

    const cameraTracks = stage.filter((t) => t.source === Track.Source.Camera)
    const screenshareTracks = stage.filter((t) => t.source === Track.Source.ScreenShare)

    let primary: TrackReferenceOrPlaceholder | undefined
    if (pinnedParticipantId) {
      primary = cameraTracks.find((t) => t.participant.identity === pinnedParticipantId)
    }
    if (!primary) {
      primary = cameraTracks.find((t) => t.participant.identity.startsWith("host-"))
    }
    if (!primary) {
      primary = cameraTracks[0]
    }

    const remaining = cameraTracks.filter((t) => t !== primary)
    const orderIndex = (identity: string) => {
      const idx = tileOrder.indexOf(identity)
      return idx === -1 ? Number.POSITIVE_INFINITY : idx
    }
    const ordered = [...remaining].sort((a, b) => {
      const ai = orderIndex(a.participant.identity)
      const bi = orderIndex(b.participant.identity)
      if (ai !== bi) return ai - bi
      return remaining.indexOf(a) - remaining.indexOf(b)
    })

    const seenIdentities = new Set<string>()
    if (primary) seenIdentities.add(primary.participant.identity)
    const dedupedRemaining: TrackReferenceOrPlaceholder[] = []
    for (const t of ordered) {
      const id = t.participant.identity
      if (seenIdentities.has(id)) continue
      seenIdentities.add(id)
      dedupedRemaining.push(t)
    }

    const assignments: (TrackReferenceOrPlaceholder | undefined)[] = []
    let remainingCursor = 0
    for (let idx = 0; idx < preset.slots.length; idx++) {
      if (preset.screenshareSlot === idx) {
        assignments.push(screenshareTracks[0])
        continue
      }
      if (idx === 0 && preset.screenshareSlot !== 0) {
        assignments.push(primary)
        continue
      }
      assignments.push(dedupedRemaining[remainingCursor])
      remainingCursor++
    }

    return assignments
  }, [tracks, onScreenParticipantIds, pinnedParticipantId, tileOrder, preset])

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: stageBackground, containerType: "size" }}
    >
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `translate(-50%, -50%) scale(min(calc(100cqw / ${CANVAS_WIDTH}px), calc(100cqh / ${CANVAS_HEIGHT}px)))`,
          backgroundColor: stageBackground,
        }}
      >
        {preset.slots.map((slot, idx) => {
          const trackRef = slotAssignments[idx]
          if (!trackRef) return null
          return (
            <div
              key={`${trackRef.participant.identity}-${trackRef.source}-${idx}`}
              className="absolute"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                width: `${slot.w}%`,
                height: `${slot.h}%`,
              }}
            >
              <VideoTile
                trackRef={trackRef}
                isVisible
                isLocal={trackRef.participant.isLocal}
                isHost={isHost}
              />
            </div>
          )
        })}

        <TextOverlayRenderer overlays={textOverlays} />
        {chatOverlayEnabled && <ChatOverlay position={chatOverlayPosition} />}
      </div>
    </div>
  )
}
