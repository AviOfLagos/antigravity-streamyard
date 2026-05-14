"use client"

import { useEffect, useState } from "react"

import { UserPlus } from "lucide-react"

import PlatformIcon, { PLATFORM_META } from "@/components/ui/PlatformIcon"
import { PLATFORM_COLORS } from "@/components/chat/PlatformBadge"
import useJoinDeltas, {
  isJoinActivityEnabled,
  subscribeJoinActivity,
} from "@/hooks/useJoinDeltas"

interface PlatformJoinPulseProps {
  /** Override the localStorage preference. Normally omitted so the host's
   *  Settings toggle drives visibility. */
  enabled?: boolean
}

/**
 * F-22: renders one "+N PLATFORM" pulse pill per platform with new join
 * activity inside the rolling window. Sits next to the platform pills in
 * the studio header. Auto-fades when the platform's queue empties.
 *
 * Designed to be cheap when idle: useJoinDeltas only re-renders when a new
 * join arrives or the 2s tick evicts stale entries. Mounting this component
 * does NOT subscribe globally — useChatStore selection is fine-grained.
 */
export default function PlatformJoinPulse({ enabled: enabledProp }: PlatformJoinPulseProps) {
  // Read localStorage on mount, then react to same-tab / cross-tab toggles.
  const [storedEnabled, setStoredEnabled] = useState(true)
  useEffect(() => {
    setStoredEnabled(isJoinActivityEnabled())
    return subscribeJoinActivity(() => setStoredEnabled(isJoinActivityEnabled()))
  }, [])

  const effective = enabledProp ?? storedEnabled
  const deltas = useJoinDeltas({ enabled: effective })

  if (!effective || deltas.length === 0) return null

  return (
    <div
      aria-live="polite"
      className="hidden sm:flex items-center gap-1 ml-1"
    >
      {deltas.map(({ platform, count }) => {
        const label = PLATFORM_META[platform]?.label ?? platform
        const color = (PLATFORM_COLORS as Record<string, string>)[platform] ?? "#6b7280"
        return (
          <span
            key={platform}
            role="status"
            aria-label={`${count} new viewer${count === 1 ? "" : "s"} on ${label}`}
            title={`+${count} new viewer${count === 1 ? "" : "s"} on ${label} in last 30s`}
            className="inline-flex items-center gap-1 rounded-full pl-1.5 pr-2 py-0.5 border text-[10px] font-semibold motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-1 motion-safe:duration-200"
            style={{
              borderColor: `${color}55`,
              backgroundColor: `${color}1a`,
              color,
            }}
          >
            <UserPlus className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="text-[10px] font-semibold tabular-nums">+{count}</span>
            <PlatformIcon platform={platform} size={10} />
          </span>
        )
      })}
    </div>
  )
}
