"use client"

import { useCallback } from "react"

import type { Platform } from "@/lib/chat/types"
import { useChatStore } from "@/store/chat"

import { PLATFORM_COLORS, PLATFORM_LABELS } from "./PlatformBadge"

const PLATFORMS: Platform[] = ["youtube", "twitch", "kick", "tiktok"]

export default function PlatformFilter() {
  const filters = useChatStore((s) => s.filters)
  const toggleFilter = useChatStore((s) => s.toggleFilter)
  const activeCount = PLATFORMS.filter((p) => filters[p]).length

  const handleToggle = useCallback((platform: Platform) => {
    toggleFilter(platform)
  }, [toggleFilter])

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-white/6">
      <span className="text-[10px] text-gray-600 mr-1 shrink-0">Filter</span>
      {PLATFORMS.map((platform) => {
        const active = filters[platform]
        const color = PLATFORM_COLORS[platform]
        return (
          <button
            key={platform}
            type="button"
            onClick={() => handleToggle(platform)}
            title={active ? `Hide ${platform}` : `Show ${platform}`}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold transition-all"
            style={
              active
                ? { backgroundColor: `${color}22`, color, outline: `1px solid ${color}44` }
                : { backgroundColor: "transparent", color: "#4b5563" }
            }
          >
            {PLATFORM_LABELS[platform]}
          </button>
        )
      })}
      <span className="ml-auto text-[9px] text-gray-700">
        {activeCount}/{PLATFORMS.length}
      </span>
    </div>
  )
}
