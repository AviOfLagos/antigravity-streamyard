import type { Platform } from "@/lib/chat/types"

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "#ef4444",
  twitch: "#a855f7",
  kick: "#22c55e",
  tiktok: "#94a3b8",
}

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YT",
  twitch: "TW",
  kick: "KI",
  tiktok: "TT",
}

interface PlatformBadgeProps {
  platform: Platform
  /** If true, renders a small 2-char label pill; otherwise renders a color dot */
  variant?: "pill" | "dot"
}

export default function PlatformBadge({ platform, variant = "dot" }: PlatformBadgeProps) {
  const color = PLATFORM_COLORS[platform]

  if (variant === "pill") {
    return (
      <span
        className="inline-flex items-center justify-center rounded text-[9px] font-bold px-1 py-0.5 shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
        title={platform}
      >
        {PLATFORM_LABELS[platform]}
      </span>
    )
  }

  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1.25"
      style={{ backgroundColor: color }}
      title={platform}
    />
  )
}

export { PLATFORM_COLORS, PLATFORM_LABELS }
