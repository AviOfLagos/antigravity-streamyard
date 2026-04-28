"use client"

import { useEffect, useRef, useState } from "react"

import { useLocalParticipant } from "@livekit/components-react"
import { Track } from "livekit-client"

interface AudioLevelBarProps {
  /** Raw MediaStreamTrack to monitor */
  mediaStreamTrack?: MediaStreamTrack | null
  /** Number of bars */
  barCount?: number
  /** Extra classes */
  className?: string
}

/**
 * Visual mic-level meter (VU bars) driven by Web Audio AnalyserNode.
 * Works with any MediaStreamTrack — used for both preview and in-room.
 */
export function AudioLevelBar({ mediaStreamTrack, barCount = 5, className }: AudioLevelBarProps) {
  const [level, setLevel] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    if (!mediaStreamTrack || mediaStreamTrack.readyState === "ended") {
      setLevel(0)
      return
    }

    let ctx: AudioContext
    try {
      ctx = new AudioContext()
    } catch {
      return
    }

    const stream = new MediaStream([mediaStreamTrack])
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.4
    source.connect(analyser)

    const buf = new Uint8Array(analyser.frequencyBinCount)
    let mounted = true

    const tick = () => {
      if (!mounted) return
      analyser.getByteFrequencyData(buf)
      let sum = 0
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
      const rms = Math.sqrt(sum / buf.length)
      setLevel(Math.min(rms / 120, 1))
      rafRef.current = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      mounted = false
      cancelAnimationFrame(rafRef.current)
      source.disconnect()
      ctx.close().catch(() => {})
    }
  }, [mediaStreamTrack])

  const activeBars = Math.round(level * barCount)

  return (
    <div className={`flex items-end gap-[3px] h-4 ${className ?? ""}`} aria-label="Microphone level">
      {Array.from({ length: barCount }).map((_, i) => (
        <div
          key={i}
          className={[
            "w-[3px] rounded-full transition-all duration-75",
            i < activeBars
              ? i < barCount * 0.6 ? "bg-emerald-400" : i < barCount * 0.85 ? "bg-yellow-400" : "bg-red-400"
              : "bg-white/10",
          ].join(" ")}
          style={{ height: `${((i + 1) / barCount) * 100}%` }}
        />
      ))}
    </div>
  )
}

/**
 * In-room audio level indicator — extracts the local mic track from LiveKit
 * context and renders AudioLevelBar.
 */
export function LocalAudioLevel({ barCount, className }: { barCount?: number; className?: string }) {
  const { localParticipant } = useLocalParticipant()
  const [mst, setMst] = useState<MediaStreamTrack | null>(null)

  useEffect(() => {
    const update = () => {
      const pub = localParticipant.getTrackPublication(Track.Source.Microphone)
      const t = pub?.isMuted ? null : (pub?.track?.mediaStreamTrack ?? null)
      setMst(t)
    }
    update()

    // Listen for track lifecycle events on the local participant
    localParticipant.on("trackMuted", update)
    localParticipant.on("trackUnmuted", update)
    localParticipant.on("trackPublished", update)
    localParticipant.on("trackUnpublished", update)

    // Also poll briefly after mount — tracks may already be published
    const timer = setTimeout(update, 500)

    return () => {
      clearTimeout(timer)
      localParticipant.off("trackMuted", update)
      localParticipant.off("trackUnmuted", update)
      localParticipant.off("trackPublished", update)
      localParticipant.off("trackUnpublished", update)
    }
  }, [localParticipant])

  if (!mst) return null
  return <AudioLevelBar mediaStreamTrack={mst} barCount={barCount} className={className} />
}
