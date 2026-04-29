import type { Platform } from "@/lib/chat/types"
import PlatformIcon from "@/components/ui/PlatformIcon"

const PLATFORM_COLORS: Record<Platform, string> = {
  youtube: "#ef4444",
  twitch: "#a855f7",
  kick: "#22c55e",
  tiktok: "#94a3b8",
  host: "#7c3aed",
  guest: "#06b6d4",
}

const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  tiktok: "TikTok",
  host: "You",
  guest: "Guest",
}

interface PlatformBadgeProps {
  platform: Platform
  variant?: "pill" | "dot" | "icon"
}

export default function PlatformBadge({ platform, variant = "dot" }: PlatformBadgeProps) {
  const color = PLATFORM_COLORS[platform]

  // Host/guest messages use a distinct pill — no platform icon
  if (platform === "host") {
    return (
      <span
        className="inline-flex items-center justify-center rounded text-[9px] font-bold px-1.5 py-0.5 shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
        title="Host message"
      >
        You
      </span>
    )
  }

  if (platform === "guest") {
    return (
      <span
        className="inline-flex items-center justify-center rounded text-[9px] font-bold px-1.5 py-0.5 shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
        title="Guest message"
      >
        Guest
      </span>
    )
  }

  if (variant === "icon") {
    return <PlatformIcon platform={platform} size={16} />
  }

  if (variant === "pill") {
    return (
      <span
        className="inline-flex items-center gap-1 justify-center rounded text-[9px] font-bold px-1.5 py-0.5 shrink-0"
        style={{ backgroundColor: `${color}22`, color }}
        title={PLATFORM_LABELS[platform]}
      >
        <PlatformIcon platform={platform} size={10} />
        {PLATFORM_LABELS[platform]}
      </span>
    )
  }

  return (
    <span
      className="inline-flex shrink-0 mt-0.5 opacity-70"
      title={PLATFORM_LABELS[platform]}
    >
      <PlatformIcon platform={platform} size={10} />
    </span>
  )
}

export { PLATFORM_COLORS, PLATFORM_LABELS }
