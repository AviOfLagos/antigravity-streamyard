"use client"

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  PartyPopper,
  Plus,
  Sparkles,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import PlatformIcon from "@/components/ui/PlatformIcon"

type Platform = { platform: string; channelName: string }
type StepId = "welcome" | "platforms" | "studio"

const ALL_PLATFORMS = [
  { id: "youtube", label: "YouTube", placeholder: "Channel name" },
  { id: "twitch", label: "Twitch", placeholder: "Channel name" },
  { id: "kick", label: "Kick", placeholder: "Channel name" },
  { id: "tiktok", label: "TikTok", placeholder: "@username" },
] as const

const STEPS: { id: StepId; label: string }[] = [
  { id: "welcome", label: "Welcome" },
  { id: "platforms", label: "Connect platforms" },
  { id: "studio", label: "First studio" },
]

interface Props {
  firstName: string | null
  initialPlatforms: Platform[]
}

export default function OnboardingWizard({ firstName, initialPlatforms }: Props) {
  const router = useRouter()
  const [stepIdx, setStepIdx] = useState(0)
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms)
  const [studioTitle, setStudioTitle] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const step = STEPS[stepIdx].id

  const stampOnboarded = async () => {
    try {
      await fetch("/api/onboarding/complete", { method: "POST" })
    } catch {
      // fail-soft — the dashboard gate falls back to data-presence check
    }
  }

  const handleSkipAll = async () => {
    posthog.capture("onboarding_skipped", { step })
    await stampOnboarded()
    router.push("/dashboard")
  }

  const handleNext = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1))
  const handleBack = () => setStepIdx((i) => Math.max(i - 1, 0))

  const handleCreateStudio = async () => {
    if (!studioTitle.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: studioTitle.trim(),
          selectedPlatforms: platforms.map((p) => p.platform),
          autoAdmit: false,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.code) {
        throw new Error(data.error ?? "Failed to create studio")
      }
      posthog.capture("onboarding_completed", {
        platform_count: platforms.length,
        platforms: platforms.map((p) => p.platform),
      })
      await stampOnboarded()
      router.push(`/studio/${data.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
      setSubmitting(false)
    }
  }

  const handleFinishWithoutStudio = async () => {
    posthog.capture("onboarding_completed", {
      platform_count: platforms.length,
      platforms: platforms.map((p) => p.platform),
      skipped_studio: true,
    })
    await stampOnboarded()
    router.push("/dashboard")
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {STEPS.map((s, i) => {
          const done = i < stepIdx
          const active = i === stepIdx
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-3 ${active ? "text-white" : done ? "text-indigo-300" : "text-gray-600"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    active
                      ? "bg-indigo-600 text-white"
                      : done
                        ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        : "bg-white/[0.04] border border-white/8 text-gray-500"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-px mx-3 ${done ? "bg-indigo-500/40" : "bg-white/8"}`}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Step body */}
      <div className="relative overflow-hidden bg-[#111111] border border-white/6 rounded-2xl">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 60%)",
          }}
        />
        <div className="relative px-8 py-10 sm:px-10 sm:py-12">
          {step === "welcome" && (
            <WelcomeStep firstName={firstName} onNext={handleNext} onSkip={handleSkipAll} />
          )}
          {step === "platforms" && (
            <PlatformsStep
              platforms={platforms}
              onChange={setPlatforms}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          {step === "studio" && (
            <StudioStep
              title={studioTitle}
              onTitleChange={setStudioTitle}
              platforms={platforms}
              submitting={submitting}
              error={error}
              onCreate={handleCreateStudio}
              onSkip={handleFinishWithoutStudio}
              onBack={handleBack}
            />
          )}
        </div>
      </div>

      {/* Skip-all link */}
      {step !== "welcome" && (
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleSkipAll}
            className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          >
            Skip setup — take me to the dashboard
          </button>
        </div>
      )}
    </div>
  )
}

// ── Welcome ────────────────────────────────────────────────────────────────

function WelcomeStep({
  firstName,
  onNext,
  onSkip,
}: {
  firstName: string | null
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="max-w-xl">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-5">
        <Sparkles className="w-3 h-3" />
        Welcome to Zerocast
      </div>
      <h1
        className="font-black text-white tracking-tight leading-[1.05] mb-3"
        style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}
      >
        {firstName ? `Welcome, ${firstName}.` : "Welcome."}
        <br />
        Take 90 seconds.
      </h1>
      <p className="text-gray-400 text-base leading-relaxed mb-8">
        Multistream to YouTube, Twitch, Kick, and TikTok from a single browser tab.
        We&apos;ll connect your platforms and spin up your first studio.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        {[
          { n: "01", title: "Connect platforms", sub: "Stream key or channel name." },
          { n: "02", title: "Name your studio", sub: "Pick a title for your stream." },
          { n: "03", title: "Go live", sub: "Invite guests by link." },
        ].map((s) => (
          <div
            key={s.n}
            className="rounded-lg border border-white/6 bg-white/[0.02] p-4"
          >
            <span className="font-mono text-xs font-bold text-indigo-400">{s.n}</span>
            <p className="text-white font-semibold text-sm mt-2 mb-1">{s.title}</p>
            <p className="text-gray-500 text-xs leading-relaxed">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          Get started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
        >
          Skip — I&apos;ll set up later
        </button>
      </div>
    </div>
  )
}

// ── Platforms ──────────────────────────────────────────────────────────────

function PlatformsStep({
  platforms,
  onChange,
  onNext,
  onBack,
}: {
  platforms: Platform[]
  onChange: (next: Platform[]) => void
  onNext: () => void
  onBack: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [channelInput, setChannelInput] = useState("")
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connectedIds = new Set(platforms.map((p) => p.platform))

  const handleConnect = async (platformId: string) => {
    if (!channelInput.trim() || connecting) return
    setConnecting(true)
    setError(null)
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? "Failed to connect")
      }
      onChange([...platforms, { platform: platformId, channelName: channelInput.trim() }])
      setExpanded(null)
      setChannelInput("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect")
    } finally {
      setConnecting(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Connect your platforms</h2>
      <p className="text-gray-400 text-sm mb-6">
        Add one or more streaming destinations. You can add more later from Settings.
      </p>

      <div className="space-y-2 mb-6">
        {ALL_PLATFORMS.map((p) => {
          const connected = connectedIds.has(p.id)
          const isExpanded = expanded === p.id

          if (connected) {
            const conn = platforms.find((x) => x.platform === p.id)
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 bg-emerald-500/[0.06] border border-emerald-500/20 rounded-xl px-4 py-3"
              >
                <PlatformIcon platform={p.id} size={20} />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{p.label}</p>
                  <p className="text-gray-500 text-xs">{conn?.channelName}</p>
                </div>
                <Check className="w-4 h-4 text-emerald-400" />
              </div>
            )
          }

          if (isExpanded) {
            return (
              <div
                key={p.id}
                className="bg-[#1a1a1a] border border-indigo-500/40 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={p.id} size={20} />
                  <input
                    type="text"
                    value={channelInput}
                    onChange={(e) => setChannelInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleConnect(p.id)}
                    placeholder={p.placeholder}
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-600 outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleConnect(p.id)}
                    disabled={!channelInput.trim() || connecting}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-40"
                  >
                    {connecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExpanded(null)
                      setChannelInput("")
                      setError(null)
                    }}
                    className="text-xs text-gray-600 hover:text-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )
          }

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setExpanded(p.id)
                setChannelInput("")
                setError(null)
              }}
              className="w-full flex items-center gap-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/6 rounded-xl px-4 py-3 transition-colors text-left"
            >
              <PlatformIcon platform={p.id} size={20} />
              <span className="flex-1 text-sm text-white">{p.label}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                Connect
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <Button
          onClick={onNext}
          className="bg-indigo-600 hover:bg-indigo-500 text-white"
        >
          {platforms.length === 0 ? "Skip for now" : "Continue"}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

// ── Studio ─────────────────────────────────────────────────────────────────

function StudioStep({
  title,
  onTitleChange,
  platforms,
  submitting,
  error,
  onCreate,
  onSkip,
  onBack,
}: {
  title: string
  onTitleChange: (v: string) => void
  platforms: Platform[]
  submitting: boolean
  error: string | null
  onCreate: () => void
  onSkip: () => void
  onBack: () => void
}) {
  return (
    <div>
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
        <Video className="w-3 h-3" />
        Final step
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Name your first studio</h2>
      <p className="text-gray-400 text-sm mb-6">
        Give your stream a title. You can change it any time before going live.
      </p>

      <label
        htmlFor="onboarding-studio-title"
        className="block text-xs text-gray-500 uppercase tracking-wide mb-1.5"
      >
        Studio name
      </label>
      <input
        id="onboarding-studio-title"
        autoFocus
        placeholder="e.g. Morning Show, Product Demo..."
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim() && !submitting) onCreate()
        }}
        className="w-full bg-[#1a1a1a] border border-white/8 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/40 transition-colors mb-5"
      />

      {platforms.length > 0 ? (
        <div className="bg-white/[0.02] border border-white/6 rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            Streaming to
          </p>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <div
                key={p.platform}
                className="flex items-center gap-2 bg-white/[0.04] rounded-full px-3 py-1.5"
              >
                <PlatformIcon platform={p.platform} size={14} />
                <span className="text-xs text-white capitalize">{p.platform}</span>
                <span className="text-xs text-gray-500">{p.channelName}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 mb-5">
          <p className="text-xs text-amber-300">
            No platforms connected. You can still create a studio and add platforms later.
          </p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            disabled={submitting}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Skip — create later
          </button>
          <Button
            onClick={onCreate}
            disabled={!title.trim() || submitting}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PartyPopper className="w-4 h-4 mr-2" />
                Create &amp; enter studio
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
