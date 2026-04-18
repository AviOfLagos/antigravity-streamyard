import type { Platform } from "@/lib/chat/types"

const PLATFORM_STYLES: Record<Platform, { bg: string; text: string; label: string }> = {
  youtube: { bg: "bg-red-600", text: "text-white", label: "YT" },
  twitch: { bg: "bg-purple-600", text: "text-white", label: "TW" },
  kick: { bg: "bg-green-600", text: "text-white", label: "KI" },
  tiktok: { bg: "bg-gray-700", text: "text-white", label: "TT" },
}

export default function PlatformBadge({ platform }: { platform: Platform }) {
  const style = PLATFORM_STYLES[platform]
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold shrink-0 ${style.bg} ${style.text}`}
      title={platform}
    >
      {style.label}
    </span>
  )
}
