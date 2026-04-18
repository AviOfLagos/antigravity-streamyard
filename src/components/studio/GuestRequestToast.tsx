"use client"

import { useState } from "react"

import { Check, UserPlus, X } from "lucide-react"

import { useStudioStore } from "@/store/studio"

interface GuestRequestToastProps {
  roomCode: string
  /** LiveKit host JWT — used as auth fallback when there is no NextAuth session (demo mode) */
  hostToken?: string
}

export default function GuestRequestToast({ roomCode, hostToken }: GuestRequestToastProps) {
  const { pendingGuests, removePendingGuest } = useStudioStore()
  const [processing, setProcessing] = useState<string | null>(null)

  const authHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(hostToken ? { Authorization: `Bearer ${hostToken}` } : {}),
  }

  const handleAdmit = async (guestId: string, name: string) => {
    setProcessing(guestId)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/admit`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ guestId, name }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("[admit] failed:", err)
        return
      }
      removePendingGuest(guestId)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeny = async (guestId: string) => {
    setProcessing(guestId)
    try {
      const res = await fetch(`/api/rooms/${roomCode}/deny`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ guestId }),
      })
      if (res.ok) removePendingGuest(guestId)
    } finally {
      setProcessing(null)
    }
  }

  if (pendingGuests.length === 0) return null

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {pendingGuests.map((guest) => (
        <div
          key={guest.guestId}
          className="pointer-events-auto flex items-center gap-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl px-4 py-3 min-w-64 animate-in slide-in-from-right-4 duration-200"
        >
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium leading-tight truncate">{guest.name}</p>
            <p className="text-gray-500 text-xs">wants to join</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => handleAdmit(guest.guestId, guest.name)}
              disabled={processing === guest.guestId}
              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 text-xs font-medium transition-colors disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              Admit
            </button>
            <button
              type="button"
              onClick={() => handleDeny(guest.guestId)}
              disabled={processing === guest.guestId}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-colors disabled:opacity-40"
              aria-label="Deny"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
