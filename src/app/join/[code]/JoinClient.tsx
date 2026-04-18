"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { LiveKitRoom } from "@livekit/components-react"
import { Loader2, UserX, Video } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SSEEventData } from "@/lib/chat/types"
import GuestStudio from "./GuestStudio"

type JoinStatus = "form" | "waiting" | "denied" | "joining" | "joined"

interface JoinClientProps {
  roomCode: string
  livekitUrl: string
}

export default function JoinClient({ roomCode, livekitUrl }: JoinClientProps) {
  const [status, setStatus] = useState<JoinStatus>("form")
  const [displayName, setDisplayName] = useState("")
  const [guestId, setGuestId] = useState<string | null>(null)
  const [livekitToken, setLivekitToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const sseRef = useRef<EventSource | null>(null)

  const handleSSEEvent = useCallback((event: SSEEventData) => {
    if (event.type === "GUEST_ADMITTED" && event.data.guestId === guestId) {
      setLivekitToken(event.data.token)
      setStatus("joining")
      setTimeout(() => setStatus("joined"), 500)
    }
    if (event.type === "GUEST_DENIED" && event.data.guestId === guestId) {
      setStatus("denied")
    }
    if (event.type === "STUDIO_ENDED") {
      window.location.href = "/studio-ended"
    }
  }, [guestId])

  useEffect(() => {
    if (status !== "waiting" || !guestId) return

    const since = Date.now() - 1000
    const es = new EventSource(`/api/rooms/${roomCode}/stream?since=${since}`)
    sseRef.current = es

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as SSEEventData
        handleSSEEvent(data)
      } catch {}
    }

    return () => { es.close() }
  }, [status, guestId, roomCode, handleSSEEvent])

  const handleRequestJoin = async () => {
    if (!displayName.trim()) return
    setError(null)

    try {
      const res = await fetch(`/api/rooms/${roomCode}/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: displayName.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to send request")
        return
      }

      const data = await res.json()
      setGuestId(data.guestId)
      setStatus("waiting")
    } catch {
      setError("Network error. Please try again.")
    }
  }

  // Form state
  if (status === "form") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-800">
          <CardHeader className="text-center">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-red-400" />
            </div>
            <CardTitle className="text-white text-xl">Join Studio</CardTitle>
            <CardDescription className="text-gray-400">
              Room <span className="font-mono text-gray-300">{roomCode}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-gray-300 text-sm">Your display name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRequestJoin()}
                placeholder="Enter your name..."
                className="mt-1.5 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                autoFocus
                maxLength={30}
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <Button
              onClick={handleRequestJoin}
              disabled={!displayName.trim()}
              className="w-full bg-red-500 hover:bg-red-600"
            >
              Request to Join
            </Button>
            <p className="text-center text-gray-500 text-xs">
              The host will need to approve your request
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Waiting state
  if (status === "waiting") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="w-full max-w-sm bg-gray-900 border-gray-800 text-center">
          <CardContent className="py-10">
            <Loader2 className="w-10 h-10 text-red-400 animate-spin mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-1">Waiting for host...</h2>
            <p className="text-gray-400 text-sm">
              The host has been notified. Please wait.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Denied state
  if (status === "denied") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Card className="w-full max-w-sm bg-gray-900 border-gray-800 text-center">
          <CardContent className="py-10">
            <UserX className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-1">Request Declined</h2>
            <p className="text-gray-400 text-sm mb-4">
              The host declined your request to join.
            </p>
            <Button
              variant="outline"
              onClick={() => { setStatus("form"); setGuestId(null); setError(null) }}
              className="border-gray-700 text-gray-300"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Joining / connected state
  if (status === "joining" || status === "joined") {
    if (!livekitToken) return null

    return (
      <LiveKitRoom
        token={livekitToken}
        serverUrl={livekitUrl}
        connect={true}
        video={true}
        audio={true}
        className="h-screen"
      >
        <GuestStudio roomCode={roomCode} displayName={displayName} />
      </LiveKitRoom>
    )
  }

  return null
}
