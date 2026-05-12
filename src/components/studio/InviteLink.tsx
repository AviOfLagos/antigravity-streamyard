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
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 max-w-xs">
      <Link className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-100 font-mono truncate select-all" title={inviteUrl}>
        /join/{roomCode}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? "Invite link copied" : "Copy invite link"}
        aria-live="polite"
        className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/8 transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        title="Copy invite link"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
