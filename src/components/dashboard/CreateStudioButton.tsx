"use client"

import { Check, Copy, Loader2, Plus } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type Step = "idle" | "creating" | "setup"

export default function CreateStudioButton() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("idle")
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    setStep("creating")
    setError(null)
    try {
      const res = await fetch("/api/rooms", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.code) {
        throw new Error(data.error ?? "Failed to create studio")
      }
      setRoomCode(data.code)
      setStep("setup")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStep("idle")
    }
  }

  const inviteUrl = roomCode ? `${window.location.origin}/join/${roomCode}` : ""

  const handleCopy = async () => {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleEnterStudio = () => {
    if (!roomCode) return
    router.push(`/studio/${roomCode}`)
  }

  const handleBack = () => {
    setStep("idle")
    setRoomCode(null)
    setCopied(false)
  }

  return (
    <>
      <Button
        onClick={handleCreate}
        disabled={step === "creating"}
        className="bg-violet-600 hover:bg-violet-700 text-white"
      >
        {step === "creating" ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Create Studio
          </>
        )}
      </Button>

      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}

      {step === "setup" && roomCode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">Studio Ready</h2>
            </div>

            {/* Room code */}
            <p className="font-mono text-xl text-white text-center py-2 mb-4 tracking-widest uppercase">
              {roomCode}
            </p>

            {/* Invite link section */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 mb-1.5">Guest invite link</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#1a1a1a] rounded-xl px-3 py-2.5 text-xs font-mono text-gray-400 truncate">
                  {inviteUrl}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-white/8 border border-white/8 text-gray-400 hover:text-white rounded-xl px-3 py-2.5 text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Platform note */}
            <p className="text-xs text-gray-500 mb-6">
              Connected platforms will stream chat automatically.{" "}
              <Link
                href="/settings/platforms"
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                Manage platforms
              </Link>
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleEnterStudio}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                Enter Studio
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="w-full text-gray-400 hover:text-white hover:bg-white/6 font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
