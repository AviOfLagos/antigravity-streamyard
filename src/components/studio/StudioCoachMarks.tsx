"use client"

import { useEffect, useMemo, useState } from "react"

import { useParticipants } from "@livekit/components-react"
import { Link2, Radio, Settings, X } from "lucide-react"

import { useStudioStore } from "@/store/studio"

interface StudioCoachMarksProps {
  connectedPlatforms: { platform: string; channelName: string }[]
  /** Cleared on guest views — coach marks are host-only. */
  isHost?: boolean
}

type TipId = "invite" | "platforms" | "golive"

interface Tip {
  id: TipId
  icon: React.ReactNode
  text: string
}

const STORAGE_PREFIX = "zc.studio.coach."

function isDismissed(id: TipId): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(STORAGE_PREFIX + id) === "1"
  } catch {
    return false
  }
}

function dismiss(id: TipId) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + id, "1")
  } catch {
    /* localStorage blocked — tip stays dismissed only for this session */
  }
}

/**
 * Progressive coach marks for first-time hosts. Renders at most one tip at a
 * time as a top banner inside the stage; each tip auto-resolves once the host
 * performs the relevant action (invites a guest, configures a platform, or
 * goes live).
 */
const TIP_IDS: TipId[] = ["invite", "platforms", "golive"]

export default function StudioCoachMarks({ connectedPlatforms, isHost }: StudioCoachMarksProps) {
  const participants = useParticipants()
  const isLive = useStudioStore((s) => s.isLive)
  // Hydrate dismissed set from localStorage on mount (client only).
  const [dismissed, setDismissed] = useState<Set<TipId>>(() => new Set())

  useEffect(() => {
    setDismissed(new Set(TIP_IDS.filter(isDismissed)))
  }, [])

  const tip = useMemo<Tip | null>(() => {
    if (!isHost) return null
    if (participants.length <= 1 && !dismissed.has("invite")) {
      return {
        id: "invite",
        icon: <Link2 className="w-3.5 h-3.5" aria-hidden="true" />,
        text: "Tap the link icon up top to invite a guest.",
      }
    }
    if (participants.length > 1 && connectedPlatforms.length === 0 && !dismissed.has("platforms")) {
      return {
        id: "platforms",
        icon: <Settings className="w-3.5 h-3.5" aria-hidden="true" />,
        text: "Connect a streaming platform from Settings to broadcast.",
      }
    }
    if (connectedPlatforms.length > 0 && !isLive && !dismissed.has("golive")) {
      return {
        id: "golive",
        icon: <Radio className="w-3.5 h-3.5" aria-hidden="true" />,
        text: "Ready when you are — hit Go Live to start streaming.",
      }
    }
    return null
  }, [isHost, participants.length, connectedPlatforms.length, isLive, dismissed])

  // Auto-dismiss tips when their condition resolves (e.g. guest arrives).
  useEffect(() => {
    if (!isHost) return
    const next: TipId[] = []
    if (participants.length > 1) next.push("invite")
    if (connectedPlatforms.length > 0) next.push("platforms")
    if (isLive) next.push("golive")
    if (next.length === 0) return
    next.forEach(dismiss)
    setDismissed((prev) => {
      const merged = new Set(prev)
      next.forEach((id) => merged.add(id))
      return merged
    })
  }, [isHost, participants.length, connectedPlatforms.length, isLive])

  if (!tip) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-30 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-300"
    >
      <div className="pointer-events-auto flex items-center gap-2 bg-indigo-500/15 border border-indigo-400/30 text-indigo-100 text-xs px-3 py-1.5 rounded-full backdrop-blur-sm shadow-lg">
        <span className="text-indigo-300">{tip.icon}</span>
        <span>{tip.text}</span>
        <button
          type="button"
          onClick={() => {
            dismiss(tip.id)
            setDismissed((prev) => {
              const merged = new Set(prev)
              merged.add(tip.id)
              return merged
            })
          }}
          aria-label="Dismiss tip"
          className="ml-1 -mr-1 p-1 rounded-full text-indigo-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
