import { ArrowRight, MessageSquare, Mic, Users, Video } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { auth } from "@/auth"
import PlatformIcon, { PLATFORM_META } from "@/components/ui/PlatformIcon"
import { Button } from "@/components/ui/button"
import { formatRecapDuration, loadPublicRecap } from "@/lib/recap"

interface Props {
  params: Promise<{ code: string }>
}

/**
 * F-26: public session recap page. Shareable URL — no auth required to view.
 *
 * Acquisition surface: anonymous viewers land here after a guest's room ends
 * and get a sign-up CTA. Authed viewers see a "Create your own studio" CTA
 * back into the dashboard. Recap data is server-rendered for share previews
 * to work.
 */
export default async function RecapPage({ params }: Props) {
  const { code } = await params
  const recap = await loadPublicRecap(code)
  if (!recap) notFound()

  const session = await auth()
  const isAuthed = Boolean(session?.user?.id)

  const platformLabels = recap.platforms
    .filter((p) => p in PLATFORM_META)
    .map((p) => PLATFORM_META[p]?.label ?? p)
  const platformSentence = platformLabels.length === 0
    ? null
    : platformLabels.length === 1
      ? `on ${platformLabels[0]}`
      : `on ${platformLabels.slice(0, -1).join(", ")} and ${platformLabels.slice(-1)}`

  return (
    <div className="min-h-dvh bg-studio-bg text-white">
      {/* Hero */}
      <div className="relative isolate overflow-hidden border-b border-white/6">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),transparent)]"
        />
        <div className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/6 border border-white/10 text-[10px] uppercase tracking-wider text-gray-300 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
            Studio ended
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            {recap.title ?? "This studio session"} ran for {formatRecapDuration(recap.durationSeconds)}
            {platformSentence ? ` ${platformSentence}` : ""}.
          </h1>
          {recap.hostName && (
            <p className="mt-3 text-sm text-gray-400">
              Hosted by <span className="text-gray-200 font-medium">{recap.hostName}</span>
            </p>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatCard
            icon={<Mic className="w-4 h-4 text-indigo-300" aria-hidden="true" />}
            label="Duration"
            value={formatRecapDuration(recap.durationSeconds)}
          />
          <StatCard
            icon={<Users className="w-4 h-4 text-indigo-300" aria-hidden="true" />}
            label="People in the room"
            value={String(Math.max(recap.peakParticipants, recap.participantCount))}
          />
          <StatCard
            icon={<MessageSquare className="w-4 h-4 text-indigo-300" aria-hidden="true" />}
            label="Chat messages"
            value={String(recap.messageCount)}
          />
        </div>

        {/* Platform list */}
        {recap.platforms.length > 0 && (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/4 p-4">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Broadcast platforms</p>
            <div className="flex flex-wrap items-center gap-2">
              {recap.platforms.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full pl-1.5 pr-2.5 py-0.5"
                >
                  <PlatformIcon platform={p} size={12} />
                  <span className="text-[11px] font-medium text-gray-200">
                    {PLATFORM_META[p]?.label ?? p}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA — branches on auth state */}
        <div className="mt-10 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 p-6 sm:p-8">
          {isAuthed ? (
            <>
              <p className="text-xs uppercase tracking-wider text-indigo-300/80 mb-2">Welcome back</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                Run your own studio next.
              </h2>
              <p className="text-sm text-gray-400 mb-5 max-w-md">
                You&apos;re already signed in. Spin up a fresh room, invite guests,
                and broadcast across YouTube, Twitch, Kick, and TikTok.
              </p>
              <Link href="/dashboard">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold inline-flex items-center gap-2">
                  Open dashboard
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-wider text-indigo-300/80 mb-2">Like what you saw?</p>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                Start your own studio in a minute.
              </h2>
              <p className="text-sm text-gray-400 mb-5 max-w-md">
                Sign up for free and broadcast to YouTube, Twitch, Kick, and TikTok at the
                same time. No download. Browser-only.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/login?returnTo=/dashboard">
                  <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold inline-flex items-center gap-2">
                    Create your studio
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Button>
                </Link>
                <Link
                  href="/"
                  className="text-sm text-gray-400 hover:text-white underline-offset-4 hover:underline transition-colors"
                >
                  Learn more
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-2 text-gray-600 text-xs">
          <Video className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Zerocast · multi-platform live streaming</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-4">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
    </div>
  )
}
