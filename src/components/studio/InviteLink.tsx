"use client"

import { useState } from "react"
import { Check, Copy, Link } from "lucide-react"

export default function InviteLink({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState(false)

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${roomCode}`
      : `/join/${roomCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 max-w-xs">
      <Link className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-300 font-mono truncate">/join/{roomCode}</span>
      <button
        onClick={handleCopy}
        className="p-1 hover:text-white text-gray-400 transition-colors shrink-0"
        title="Copy invite link"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
