"use client"

import { TrackRefContext, VideoTrack, useEnsureTrackRef } from "@livekit/components-react"
import type { TrackReference, TrackReferenceOrPlaceholder } from "@livekit/components-react"

interface VideoTileProps {
  trackRef: TrackReferenceOrPlaceholder
  isVisible: boolean
  isLocal?: boolean
}

function isTrackReference(ref: TrackReferenceOrPlaceholder): ref is TrackReference {
  return ref.publication !== undefined
}

export default function VideoTile({ trackRef, isVisible, isLocal }: VideoTileProps) {
  const ensuredTrackRef = useEnsureTrackRef(trackRef)
  const displayName =
    trackRef.participant?.name ??
    trackRef.participant?.identity ??
    "Guest"

  if (!isVisible) return null

  const hasVideo = isTrackReference(ensuredTrackRef) &&
    (ensuredTrackRef.publication?.isSubscribed || trackRef.participant?.isLocal)

  return (
    <TrackRefContext.Provider value={ensuredTrackRef}>
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        {hasVideo ? (
          <VideoTrack trackRef={ensuredTrackRef as TrackReference} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-gray-400 text-sm">Camera off</span>
          </div>
        )}
        <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
          {isLocal ? `${displayName} (You)` : displayName}
        </div>
      </div>
    </TrackRefContext.Provider>
  )
}
