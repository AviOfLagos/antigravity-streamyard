"use client"

import { useCallback } from "react"

import type { Platform } from "@/lib/chat/types"
import { useChatStore } from "@/store/chat"
import PlatformIcon from "@/components/ui/PlatformIcon"

import { PLATFORM_COLORS, PLATFORM_LABELS } from "./PlatformBadge"

interface PlatformFilterProps {
  connectedPlatforms?: { platform: string; channelName: string }[]
}

export default function PlatformFilter({ connectedPlatforms = [] }: PlatformFilterProps) {
  const filters = useChatStore((s) => s.filters)
  const toggleFilter = useChatStore((s) => s.toggleFilter)

  // Only show pills for platforms that are actually connected
  const connected = connectedPlatforms
    .map((p) => p.platform.toLowerCase() as Platform)
    .filter((p): p is Platform => p in PLATFORM_COLORS)

  const activeCount = connected.filter((p) => filters[p]).length

  const handleToggle = useCallback((platform: Platform) => {
    toggleFilter(platform)
  }, [toggleFilter])

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/6 min-h-[34px]">
      <span className="text-[10px] text-gray-600 mr-1 shrink-0">Filter</span>

      {connected.length === 0 ? (
        <span className="text-[10px] text-gray-700 italic">No platforms connected</span>
      ) : (
        <>
          {connected.map((platform) => {
            const active = filters[platform]
            const color = PLATFORM_COLORS[platform]
            return (
              <button
                key={platform}
                type="button"
                onClick={() => handleToggle(platform)}
                title={active ? `Hide ${PLATFORM_LABELS[platform]}` : `Show ${PLATFORM_LABELS[platform]}`}
                className={[
                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all",
                  active ? "ring-2 ring-emerald-400/50" : "",
                ].join(" ")}
                style={
                  active
                    ? { backgroundColor: `${color}22`, color, outline: `1px solid ${color}44` }
                    : { backgroundColor: "transparent", color: "#4b5563" }
                }
              >
                <PlatformIcon platform={platform} size={14} />
                {PLATFORM_LABELS[platform]}
              </button>
            )
          })}
          <span className="ml-auto text-[9px] text-gray-700">
            {activeCount}/{connected.length}
          </span>
        </>
      )}
    </div>
  )
}
