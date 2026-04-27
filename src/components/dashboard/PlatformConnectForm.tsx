"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Trash2, RefreshCw, AlertCircle, Clock, Eye, EyeOff, Key } from "lucide-react"
import { toast } from "sonner"
import PlatformIcon from "@/components/ui/PlatformIcon"

type TokenHealth = "connected" | "expiring_soon" | "expired" | "no_token"

const STREAM_KEY_HINTS: Record<string, string> = {
  youtube: "Find your stream key in YouTube Studio \u2192 Go Live \u2192 Stream settings",
  twitch: "Find your stream key in Twitch Creator Dashboard \u2192 Settings \u2192 Stream",
  kick: "Find your stream key in Kick Dashboard \u2192 Settings \u2192 Stream",
  tiktok: "Get your RTMP URL and stream key from TikTok Live Center",
}

interface PlatformConnectFormProps {
  platform: string
  label: string
  color?: string
  placeholder: string
  helpText: string
  connection: {
    channelName: string
    channelId: string
    tokenHealth?: TokenHealth
    expiresAt?: string | null
    hasStreamKey?: boolean
    hasIngestUrl?: boolean
  } | null
}

function TokenHealthBadge({ health, platform }: { health: TokenHealth; platform: string }) {
  if (health === "no_token") {
    // Kick and TikTok don't need token management
    if (platform === "kick" || platform === "tiktok") {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
          No token needed
        </span>
      )
    }
    return null
  }

  if (health === "expired") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-red-400 bg-red-950 px-2 py-0.5 rounded-full">
        <AlertCircle className="w-3 h-3" />
        Expired
      </span>
    )
  }

  if (health === "expiring_soon") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-400 bg-yellow-950 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />
        Expiring Soon
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" />
      Connected
    </span>
  )
}

function StreamKeySection({ platform, hasStreamKey: initialHasStreamKey, hasIngestUrl: initialHasIngestUrl }: {
  platform: string
  hasStreamKey: boolean
  hasIngestUrl: boolean
}) {
  const [streamKey, setStreamKey] = useState("")
  const [ingestUrl, setIngestUrl] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [showUrl, setShowUrl] = useState(false)
  const [saving, setSaving] = useState(false)
  const [hasStreamKey, setHasStreamKey] = useState(initialHasStreamKey)
  const [hasIngestUrl, setHasIngestUrl] = useState(initialHasIngestUrl)

  const handleSaveStreamKey = async () => {
    if (!streamKey.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/platforms/stream-key", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          streamKey: streamKey.trim(),
          ...(platform === "tiktok" && ingestUrl.trim() ? { ingestUrl: ingestUrl.trim() } : {}),
        }),
      })
      if (res.ok) {
        setHasStreamKey(true)
        if (platform === "tiktok" && ingestUrl.trim()) setHasIngestUrl(true)
        setStreamKey("")
        setIngestUrl("")
        toast.success("Stream key saved", { description: `${platform} stream key updated successfully.` })
      } else {
        toast.error("Failed to save stream key")
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-400">Stream Key</span>
        </div>
        {hasStreamKey ? (
          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            Stream key saved
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
            No stream key
          </span>
        )}
      </div>

      <p className="text-[11px] text-gray-600 mb-2">{STREAM_KEY_HINTS[platform]}</p>

      {platform === "tiktok" && (
        <div className="mb-2">
          <Label className="text-gray-500 text-[11px]">RTMP URL</Label>
          <div className="relative mt-1">
            <Input
              type={showUrl ? "text" : "password"}
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder={hasIngestUrl ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (saved)" : "rtmp://..."}
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 pr-9 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowUrl(!showUrl)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
            >
              {showUrl ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={showKey ? "text" : "password"}
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            placeholder={hasStreamKey ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022 (saved)" : "Enter stream key"}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 pr-9 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSaveStreamKey()}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <Button
          onClick={handleSaveStreamKey}
          disabled={saving || !streamKey.trim()}
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save"}
        </Button>
      </div>
    </div>
  )
}

export default function PlatformConnectForm({
  platform, label, placeholder, helpText, connection
}: PlatformConnectFormProps) {
  const [channelName, setChannelName] = useState(connection?.channelName ?? "")
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [connected, setConnected] = useState(!!connection)
  const [tokenHealth, setTokenHealth] = useState<TokenHealth>(connection?.tokenHealth ?? "no_token")

  const handleConnect = async () => {
    if (!channelName.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/platforms/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, channelName: channelName.trim(), channelId: channelName.trim() }),
      })
      if (res.ok) setConnected(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/platforms/disconnect", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
      if (res.ok) { setConnected(false); setChannelName("") }
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/platforms/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.status) setTokenHealth(data.status as TokenHealth)
      }
    } finally {
      setRefreshing(false)
    }
  }

  const showRefreshButton = connected && platform !== "kick" && platform !== "tiktok" && tokenHealth !== "no_token"

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <PlatformIcon platform={platform} size={22} />
            {label}
          </CardTitle>
          {connected && (
            <div className="flex items-center gap-2">
              <TokenHealthBadge health={tokenHealth} platform={platform} />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-gray-300 text-sm font-mono">{channelName}</p>
              <div className="flex items-center gap-2">
                {showRefreshButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {refreshing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><RefreshCw className="w-4 h-4 mr-1" />Refresh</>
                    }
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="text-red-400 hover:text-red-300"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4 mr-1" />Remove</>}
                </Button>
              </div>
            </div>

            {/* Stream Key Section */}
            <StreamKeySection
              platform={platform}
              hasStreamKey={connection?.hasStreamKey ?? false}
              hasIngestUrl={connection?.hasIngestUrl ?? false}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label className="text-gray-400 text-xs">{helpText}</Label>
            <div className="flex gap-2">
              <Input
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder={placeholder}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleConnect()}
              />
              <Button onClick={handleConnect} disabled={loading || !channelName.trim()} className="bg-red-500 hover:bg-red-600">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
