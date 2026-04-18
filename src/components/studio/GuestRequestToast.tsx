"use client"

import { useState } from "react"
import { UserPlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useStudioStore } from "@/store/studio"

interface GuestRequestToastProps {
  roomCode: string
}

export default function GuestRequestToast({ roomCode }: GuestRequestToastProps) {
  const { pendingGuests, removePendingGuest } = useStudioStore()
  const [processing, setProcessing] = useState<string | null>(null)

  const handleAdmit = async (guestId: string, name: string) => {
    setProcessing(guestId)
    try {
      await fetch(`/api/rooms/${roomCode}/admit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId, name }),
      })
      removePendingGuest(guestId)
    } finally {
      setProcessing(null)
    }
  }

  const handleDeny = async (guestId: string) => {
    setProcessing(guestId)
    try {
      await fetch(`/api/rooms/${roomCode}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      })
      removePendingGuest(guestId)
    } finally {
      setProcessing(null)
    }
  }

  if (pendingGuests.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {pendingGuests.map((guest) => (
        <div
          key={guest.guestId}
          className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-4 flex items-center gap-3 min-w-72 animate-in slide-in-from-right"
        >
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
            <UserPlus className="w-4 h-4 text-gray-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{guest.name}</p>
            <p className="text-gray-400 text-xs">wants to join</p>
          </div>
          <div className="flex gap-1.5">
            <Button
              size="sm"
              onClick={() => handleAdmit(guest.guestId, guest.name)}
              disabled={processing === guest.guestId}
              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-xs"
            >
              Admit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeny(guest.guestId)}
              disabled={processing === guest.guestId}
              className="h-7 px-2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
