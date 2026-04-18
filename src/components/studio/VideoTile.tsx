"use client"

import { TrackRefContext, VideoTrack, useEnsureTrackRef, useIsSpeaking, type TrackReference, type TrackReferenceOrPlaceholder } from "@livekit/components-react"
import { Eye, EyeOff } from "lucide-react"

import { useStudioStore } from "@/store/studio"

interface VideoTileProps {
  trackRef: TrackReferenceOrPlaceholder
  isVisible: boolean
  isLocal?: boolean
  isHost?: boolean
}

function isTrackReference(ref: TrackReferenceOrPlaceholder): ref is TrackReference {
  return ref.publication !== undefined
}

export default function VideoTile({ trackRef, isVisible, isLocal, isHost }: VideoTileProps) {
  const ensuredRef = useEnsureTrackRef(trackRef)
  const isSpeaking = useIsSpeaking(trackRef.participant)
  const { toggleOnScreen } = useStudioStore()

  const displayName = trackRef.participant?.name ?? trackRef.participant?.identity ?? "Guest"
  const participantId = trackRef.participant?.identity ?? ""

  const hasVideo =
    isTrackReference(ensuredRef) &&
    (ensuredRef.publication?.isSubscribed || trackRef.participant?.isLocal)

  if (!isVisible) return null

  return (
    <TrackRefContext.Provider value={ensuredRef}>
      <div
        className={[
          "relative bg-[#1a1a1a] rounded-xl overflow-hidden aspect-video flex items-center justify-center",
          isSpeaking ? "ring-2 ring-violet-500/70" : "ring-1 ring-white/4",
        ].join(" ")}
      >
        {hasVideo ? (
          <VideoTrack
            trackRef={ensuredRef as TrackReference}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl font-semibold text-white select-none">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-500 text-xs">Camera off</span>
          </div>
        )}

        {/* Name label */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {isSpeaking && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          )}
          <span className="text-white text-[11px] font-medium bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {isLocal ? `${displayName} (You)` : displayName}
          </span>
        </div>

        {/* Host-only: on-screen toggle */}
        {isHost && !isLocal && (
          <button
            type="button"
            onClick={() => toggleOnScreen(participantId)}
            className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 backdrop-blur-sm text-gray-400 hover:text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
            title="Toggle on screen"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </TrackRefContext.Provider>
  )
}

/** Tile shown when a participant is toggled off-screen by the host */
export function OffScreenTile({ trackRef, isHost }: { trackRef: TrackReferenceOrPlaceholder; isHost?: boolean }) {
  const { toggleOnScreen } = useStudioStore()
  const displayName = trackRef.participant?.name ?? trackRef.participant?.identity ?? "Guest"
  const participantId = trackRef.participant?.identity ?? ""

  if (!isHost) return null

  return (
    <div className="relative bg-[#111] rounded-xl overflow-hidden aspect-video flex items-center justify-center ring-1 ring-white/4 opacity-40">
      <div className="flex flex-col items-center gap-2">
        <EyeOff className="w-6 h-6 text-gray-600" />
        <span className="text-gray-600 text-xs">{displayName}</span>
      </div>
      <button
        type="button"
        onClick={() => toggleOnScreen(participantId)}
        className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-gray-500 hover:text-white transition-colors"
        title="Bring on screen"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
