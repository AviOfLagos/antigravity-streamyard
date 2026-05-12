"use client"

import { useCallback, useMemo, useState } from "react"

import { Check, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

import { useStudioStore } from "@/store/studio"

interface GuestRequestToastProps {
  roomCode: string
  /** LiveKit host JWT — used as auth fallback when there is no NextAuth session (demo mode) */
  hostToken?: string
}

export default function GuestRequestToast({ roomCode, hostToken }: GuestRequestToastProps) {
  const pendingGuests = useStudioStore((s) => s.pendingGuests)
  const removePendingGuest = useStudioStore((s) => s.removePendingGuest)
  const [processing, setProcessing] = useState<string | null>(null)

  const authHeaders = useMemo<Record<string, string>>(() => ({
    "Content-Type": "application/json",
    ...(hostToken ? { Authorization: `Bearer ${hostToken}` } : {}),
  }), [hostToken])

  const handleAdmit = useCallback(async (guestId: string, name: string) => {
    setProcessing(guestId)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/admit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ guestId, name }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        const msg = err.error ?? "Failed to admit guest"
        toast.error(`Could not admit ${name}`, { description: msg })
        // If room is full or ended, remove from pending since it can't succeed
        if (res.status === 400 || res.status === 410) {
          removePendingGuest(guestId)
        }
        return
      }
      removePendingGuest(guestId)
      toast.success(`${name} admitted`)
    } catch {
      toast.error("Network error", { description: "Could not reach the server. Try again." })
    } finally {
      setProcessing(null)
    }
  }, [roomCode, authHeaders, removePendingGuest])

  const handleDeny = useCallback(async (guestId: string) => {
    setProcessing(guestId)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/deny`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ guestId }),
      })
      if (res.ok) {
        removePendingGuest(guestId)
      } else {
        // Remove from UI anyway — the guest request is stale
        removePendingGuest(guestId)
      }
    } catch {
      // Network error — remove from UI to avoid stale toasts
      removePendingGuest(guestId)
    } finally {
      setProcessing(null)
    }
  }, [roomCode, authHeaders, removePendingGuest])

  if (pendingGuests.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Guest join requests"
      aria-live="polite"
      className="fixed top-16 right-4 left-4 sm:left-auto z-50 flex flex-col gap-2 pointer-events-none max-w-[min(20rem,calc(100vw-2rem))] sm:max-w-sm ml-auto"
    >
      {pendingGuests.map((guest) => (
        <div
          key={guest.guestId}
          className="pointer-events-auto flex items-center gap-3 bg-studio-elevated border border-white/10 rounded-xl shadow-2xl px-4 py-3 motion-safe:animate-in motion-safe:slide-in-from-right-4 motion-safe:duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-violet-400" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium leading-tight truncate">{guest.name}</p>
            <p className="text-gray-400 text-xs">wants to join</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleAdmit(guest.guestId, guest.name)}
              disabled={processing === guest.guestId}
              aria-label={`Admit ${guest.name}`}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 text-xs font-medium transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-elevated"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Admit
            </button>
            <button
              type="button"
              onClick={() => handleDeny(guest.guestId)}
              disabled={processing === guest.guestId}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-elevated"
              aria-label={`Deny ${guest.name}`}
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
