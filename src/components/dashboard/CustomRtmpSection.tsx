"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CustomDest {
  id: string
  name: string
  ingestUrl: string
  createdAt: string
}

export default function CustomRtmpSection() {
  const [destinations, setDestinations] = useState<CustomDest[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [ingestUrl, setIngestUrl] = useState("")
  const [streamKey, setStreamKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  useEffect(() => {
    fetch("/api/platforms/custom-rtmp")
      .then((r) => r.json())
      .then((data) => setDestinations(data.destinations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleAdd = async () => {
    if (!name.trim() || !ingestUrl.trim() || !streamKey.trim()) return
    setAdding(true)
    try {
      const res = await fetch("/api/platforms/custom-rtmp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          ingestUrl: ingestUrl.trim(),
          streamKey: streamKey.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.destination) {
        setDestinations((prev) => [data.destination, ...prev])
        setName("")
        setIngestUrl("")
        setStreamKey("")
        setShowForm(false)
        toast.success("Custom RTMP destination added")
      } else {
        toast.error(data.error ?? "Failed to add destination")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/platforms/custom-rtmp", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        setDestinations((prev) => prev.filter((d) => d.id !== id))
        toast.success("Destination removed")
      }
    } catch {
      toast.error("Failed to remove")
    }
  }

  if (loading) {
    return <div className="text-gray-600 text-sm py-4">Loading...</div>
  }

  return (
    <div className="space-y-3">
      {/* Existing destinations */}
      {destinations.map((dest) => (
        <div
          key={dest.id}
          className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p className="text-white text-sm font-medium">{dest.name}</p>
            <p className="text-gray-500 text-xs truncate max-w-xs">{dest.ingestUrl}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(dest.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Remove
          </Button>
        </div>
      ))}

      {/* Add form */}
      {showForm ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3">
          <div>
            <Label className="text-gray-400 text-xs">Destination name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Facebook Live, LinkedIn, My Server"
              className="mt-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
              maxLength={50}
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">RTMP Server URL</Label>
            <Input
              value={ingestUrl}
              onChange={(e) => setIngestUrl(e.target.value)}
              placeholder="rtmp://live.example.com/app"
              className="mt-1 bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            />
          </div>
          <div>
            <Label className="text-gray-400 text-xs">Stream Key</Label>
            <div className="relative mt-1">
              <Input
                type={showKey ? "text" : "password"}
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                placeholder="Enter stream key"
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600 pr-9"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => { setShowForm(false); setName(""); setIngestUrl(""); setStreamKey("") }}
              className="text-gray-400"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding || !name.trim() || !ingestUrl.trim() || !streamKey.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Add Destination
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          onClick={() => setShowForm(true)}
          className="w-full border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Custom RTMP Destination
        </Button>
      )}

      {destinations.length >= 10 && (
        <p className="text-xs text-gray-600 text-center">Maximum 10 custom destinations reached</p>
      )}
    </div>
  )
}
