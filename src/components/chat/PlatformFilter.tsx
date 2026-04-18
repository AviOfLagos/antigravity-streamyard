"use client"

import { useChatStore } from "@/store/chat"
import type { Platform } from "@/lib/chat/types"

const PLATFORMS: { key: Platform; label: string; activeClass: string }[] = [
  { key: "youtube", label: "YT", activeClass: "bg-red-600 text-white" },
  { key: "twitch", label: "TW", activeClass: "bg-purple-600 text-white" },
  { key: "kick", label: "KI", activeClass: "bg-green-600 text-white" },
  { key: "tiktok", label: "TT", activeClass: "bg-gray-600 text-white" },
]

export default function PlatformFilter() {
  const { filters, toggleFilter } = useChatStore()

  return (
    <div className="flex gap-1 p-2 border-b border-gray-800">
      {PLATFORMS.map((p) => (
        <button
          key={p.key}
          onClick={() => toggleFilter(p.key)}
          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
            filters[p.key]
              ? p.activeClass
              : "bg-gray-800 text-gray-500 hover:text-gray-300"
          }`}
          title={filters[p.key] ? `Hide ${p.key} chat` : `Show ${p.key} chat`}
        >
          {p.label}
        </button>
      ))}
      <div className="ml-auto flex items-center">
        <span className="text-[10px] text-gray-500">
          {PLATFORMS.filter((p) => filters[p.key]).length}/{PLATFORMS.length}
        </span>
      </div>
    </div>
  )
}
