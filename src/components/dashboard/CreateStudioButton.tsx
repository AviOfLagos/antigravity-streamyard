"use client"

import { Check, Copy, Loader2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { PlatformListResponseSchema } from "@/lib/schemas/platform"
import { CreateRoomResponseSchema } from "@/lib/schemas/room"
import type { PlatformConnection } from "@/lib/schemas/platform"

type Step = "idle" | "creating-modal" | "submitting" | "ready"

const PLATFORM_COLORS: Record<string, string> = {
  youtube: "#ef4444",
  twitch: "#a855f7",
  kick: "#22c55e",
  tiktok: "#94a3b8",
}

export default function CreateStudioButton() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("idle")
  const [title, setTitle] = useState("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [autoAdmit, setAutoAdmit] = useState(false)
  const [availablePlatforms, setAvailablePlatforms] = useState<PlatformConnection[]>([])
  const [roomCode, setRoomCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (step !== "creating-modal") return
    fetch("/api/platforms")
      .then((r) => r.json())
      .then((data) => {
        const parsed = PlatformListResponseSchema.safeParse(data)
        if (parsed.success) setAvailablePlatforms(parsed.data.platforms)
        else if (Array.isArray(data.platforms)) setAvailablePlatforms(data.platforms)
      })
      .catch(() => {})
  }, [step])

  const handleOpen = () => {
    setError(null)
    setStep("creating-modal")
  }

  const handleCancel = () => {
    setStep("idle")
    setTitle("")
    setSelectedPlatforms([])
    setAutoAdmit(false)
    setAvailablePlatforms([])
    setError(null)
  }

  const handleTogglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform],
    )
  }

  const handleCreate = async () => {
    if (!title.trim()) return
    setStep("submitting")
    setError(null)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), selectedPlatforms, autoAdmit }),
      })
      const data = await res.json()
      if (!res.ok || !data.code) {
        throw new Error(data.error ?? "Failed to create studio")
      }
      const parsed = CreateRoomResponseSchema.safeParse(data)
      if (parsed.success) {
        setRoomCode(parsed.data.code)
      } else {
        setRoomCode(data.code)
      }
      setStep("ready")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setStep("creating-modal")
    }
  }

  const inviteUrl = roomCode
    ? typeof window !== "undefined"
      ? `${window.location.origin}/join/${roomCode}`
      : `/join/${roomCode}`
    : ""

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
    setTitle("")
    setSelectedPlatforms([])
    setAutoAdmit(false)
    setAvailablePlatforms([])
    setCopied(false)
    setError(null)
  }

  const isModalOpen = step === "creating-modal" || step === "submitting" || step === "ready"

  return (
    <>
      <Button
        onClick={handleOpen}
        disabled={step === "submitting"}
        className="bg-violet-600 hover:bg-violet-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Studio
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          {/* ── Step 1: Details ── */}
          {(step === "creating-modal" || step === "submitting") && (
            <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 w-full max-w-lg mx-4">
              <h2 className="text-white font-semibold text-lg mb-5">Create Studio</h2>

              {/* Title input */}
              <div className="mb-5">
                <label
                  htmlFor="studio-title"
                  className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5"
                >
                  Studio name
                </label>
                <input
                  id="studio-title"
                  placeholder="e.g. Morning Show, Product Demo..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/40 transition-colors"
                />
              </div>

              {/* Platform selection + inline connect */}
              <div className="mb-5">
                <p className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Platforms
                </p>

                {/* Connected platforms */}
                {availablePlatforms.length > 0 && (
                  <ul className="space-y-2 mb-3">
                    {availablePlatforms.map(({ platform, channelName }) => {
                      const isChecked = selectedPlatforms.includes(platform)
                      const color = PLATFORM_COLORS[platform.toLowerCase()] ?? "#94a3b8"
                      return (
                        <li key={platform}>
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded accent-violet-500"
                              checked={isChecked}
                              onChange={() => handleTogglePlatform(platform)}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm text-white capitalize">{platform}</span>
                            <span className="text-sm text-gray-500">{channelName}</span>
                          </label>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Quick-connect for platforms not yet connected */}
                <InlineConnectPlatforms
                  connectedPlatforms={availablePlatforms.map((p) => p.platform.toLowerCase())}
                  onConnected={(platform, channelName) => {
                    setAvailablePlatforms((prev) => [
                      ...prev.filter((p) => p.platform !== platform),
                      { platform, channelName },
                    ])
                    setSelectedPlatforms((prev) =>
                      prev.includes(platform) ? prev : [...prev, platform]
                    )
                  }}
                />

                {title.trim() && availablePlatforms.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Stream title will be: {title.trim()}
                  </p>
                )}
              </div>

              {/* Access control */}
              <div className="mb-5">
                <p className="block text-xs text-gray-500 uppercase tracking-wide mb-2">
                  Guest access
                </p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="access-control"
                      className="w-4 h-4 accent-violet-500"
                      checked={!autoAdmit}
                      onChange={() => setAutoAdmit(false)}
                    />
                    <div>
                      <span className="text-sm text-white">Manual approval</span>
                      <p className="text-xs text-gray-500">You approve each guest before they enter</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="access-control"
                      className="w-4 h-4 accent-violet-500"
                      checked={autoAdmit}
                      onChange={() => setAutoAdmit(true)}
                    />
                    <div>
                      <span className="text-sm text-white">Auto-admit</span>
                      <p className="text-xs text-gray-500">Anyone with the link joins automatically</p>
                    </div>
                  </label>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={step === "submitting"}
                  className="text-gray-400 hover:text-white hover:bg-white/6 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={title.trim() === "" || step === "submitting"}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  {step === "submitting" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Studio →
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Ready ── */}
          {step === "ready" && roomCode && (
            <div className="bg-[#111111] border border-white/8 rounded-2xl p-6 w-full max-w-lg mx-4">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <h2 className="text-white font-semibold text-lg">Studio Ready</h2>
              </div>

              {/* Room title */}
              <p className="text-lg font-semibold text-white mb-1">{title || roomCode}</p>

              {/* Room code */}
              <p className="font-mono text-sm text-gray-500 tracking-widest uppercase mb-4">
                {roomCode}
              </p>

              {/* Selected platforms summary */}
              {selectedPlatforms.length > 0 && (
                <p className="text-xs text-gray-500 mb-4">
                  Streaming chat from:{" "}
                  {selectedPlatforms.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                </p>
              )}

              {/* Invite link */}
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
          )}
        </div>
      )}
    </>
  )
}

// ── Inline platform connect ──────────────────────────────────────────────────

const ALL_PLATFORMS = [
  { id: "youtube", label: "YouTube", color: "#ef4444", placeholder: "Channel ID (UC...)" },
  { id: "twitch", label: "Twitch", color: "#a855f7", placeholder: "Channel name" },
  { id: "kick", label: "Kick", color: "#22c55e", placeholder: "Channel name" },
  { id: "tiktok", label: "TikTok", color: "#94a3b8", placeholder: "@username" },
]

function InlineConnectPlatforms({
  connectedPlatforms,
  onConnected,
}: {
  connectedPlatforms: string[]
  onConnected: (platform: string, channelName: string) => void
}) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  const [channelInput, setChannelInput] = useState("")
  const [connecting, setConnecting] = useState(false)

  const unconnected = ALL_PLATFORMS.filter(
    (p) => !connectedPlatforms.includes(p.id)
  )

  if (unconnected.length === 0) return null

  const handleConnect = async (platformId: string) => {
    if (!channelInput.trim() || connecting) return
    setConnecting(true)
    try {
      const res = await fetch("/api/platforms/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: platformId,
          channelName: channelInput.trim(),
          channelId: channelInput.trim(),
        }),
      })
      if (res.ok) {
        onConnected(platformId, channelInput.trim())
        setExpandedPlatform(null)
        setChannelInput("")
      }
    } catch {
      // Silent fail
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-gray-600 uppercase tracking-wide">Quick connect</p>
      {unconnected.map((platform) => (
        <div key={platform.id}>
          {expandedPlatform === platform.id ? (
            <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-xl px-3 py-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: platform.color }}
              />
              <input
                type="text"
                value={channelInput}
                onChange={(e) => setChannelInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConnect(platform.id)}
                placeholder={platform.placeholder}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={() => handleConnect(platform.id)}
                disabled={!channelInput.trim() || connecting}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium disabled:opacity-40"
              >
                {connecting ? "..." : "Connect"}
              </button>
              <button
                type="button"
                onClick={() => { setExpandedPlatform(null); setChannelInput("") }}
                className="text-xs text-gray-600 hover:text-gray-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setExpandedPlatform(platform.id)}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl hover:bg-white/4 transition-colors text-left"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: platform.color }}
              />
              <span className="text-sm text-gray-500">
                + Connect {platform.label}
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
