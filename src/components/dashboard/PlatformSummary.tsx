import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

const PLATFORM_CONFIG = {
  youtube: { label: "YouTube", color: "bg-red-500", icon: "YT" },
  twitch: { label: "Twitch", color: "bg-purple-500", icon: "TW" },
  kick: { label: "Kick", color: "bg-green-500", icon: "KI" },
  tiktok: { label: "TikTok", color: "bg-gray-800", icon: "TT" },
}

export default function PlatformSummary({ platforms }: { platforms: { platform: string; channelName: string }[] }) {
  const connected = new Set(platforms.map((p) => p.platform))

  return (
    <>
      <Card className="col-span-2 bg-gray-900 border-gray-800">
        <CardContent className="py-4 px-5">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm font-medium text-gray-300">Connected Platforms</p>
            <Link href="/settings/platforms">
              <Button variant="ghost" size="sm" className="text-gray-400 h-7 px-2">
                <Settings className="w-3.5 h-3.5 mr-1" />Manage
              </Button>
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(PLATFORM_CONFIG).map(([key, cfg]) => (
              <div
                key={key}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  connected.has(key)
                    ? `${cfg.color} text-white`
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                {connected.has(key) && <span className="ml-1">✓</span>}
              </div>
            ))}
          </div>
          {connected.size === 0 && (
            <p className="text-gray-500 text-xs mt-2">No platforms connected yet</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
