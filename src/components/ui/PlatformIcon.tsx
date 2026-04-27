"use client"

interface PlatformIconProps {
  platform: string
  size?: number
  className?: string
}

export default function PlatformIcon({ platform, size = 20, className = "" }: PlatformIconProps) {
  const p = platform.toLowerCase()
  const s = size

  switch (p) {
    case "youtube":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className}>
          <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    case "twitch":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className}>
          <path fill="#9146FF" d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
        </svg>
      )
    case "kick":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className}>
          <path fill="#53FC18" d="M1.2 0h6v4.8h2.4V2.4h2.4V0h6v2.4h-2.4v2.4h-2.4v2.4h-2.4v2.4H8.4v2.4h2.4v2.4h2.4v2.4h2.4v2.4h2.4V24h-6v-2.4h-2.4v-2.4H8.4v-2.4H6v-2.4H3.6v-2.4H1.2V0zm0 12h2.4v2.4h2.4v2.4h2.4v2.4h2.4V24h-6v-4.8H1.2V12z" />
        </svg>
      )
    case "tiktok":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" className={className}>
          <path fill="#ffffff" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.88 2.89 2.89 0 0 1-2.88-2.88 2.89 2.89 0 0 1 2.88-2.88c.3 0 .59.04.86.11v-3.5a6.37 6.37 0 0 0-.86-.06A6.34 6.34 0 0 0 3.15 15.6 6.34 6.34 0 0 0 9.49 22a6.34 6.34 0 0 0 6.34-6.34V9.4a8.16 8.16 0 0 0 4.78 1.53V7.48a4.85 4.85 0 0 1-1.02-.79z"/>
        </svg>
      )
    default:
      return (
        <div
          className={`rounded bg-gray-600 flex items-center justify-center text-white text-[8px] font-bold ${className}`}
          style={{ width: s, height: s }}
        >
          {platform.charAt(0).toUpperCase()}
        </div>
      )
  }
}

export const PLATFORM_META: Record<string, { label: string; color: string; bgColor: string }> = {
  youtube: { label: "YouTube", color: "#FF0000", bgColor: "bg-red-600" },
  twitch: { label: "Twitch", color: "#9146FF", bgColor: "bg-purple-600" },
  kick: { label: "Kick", color: "#53FC18", bgColor: "bg-green-600" },
  tiktok: { label: "TikTok", color: "#ffffff", bgColor: "bg-black" },
}
