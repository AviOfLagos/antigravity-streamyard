"use client"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, CheckCircle2, Trash2 } from "lucide-react"

interface PlatformConnectFormProps {
  platform: string
  label: string
  color: string
  placeholder: string
  helpText: string
  connection: { channelName: string; channelId: string } | null
}

export default function PlatformConnectForm({
  platform, label, color, placeholder, helpText, connection
}: PlatformConnectFormProps) {
  const [channelName, setChannelName] = useState(connection?.channelName ?? "")
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(!!connection)

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

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className={`w-5 h-5 rounded ${color} flex items-center justify-center text-[10px] font-bold text-white`}>
              {label[0]}
            </span>
            {label}
          </CardTitle>
          {connected && (
            <div className="flex items-center gap-1.5 text-green-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Connected
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {connected ? (
          <div className="flex items-center justify-between">
            <p className="text-gray-300 text-sm font-mono">{channelName}</p>
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
