import { Suspense } from "react"

import { RoomStatus } from "@prisma/client"
import {
  Activity,
  Clock,
  PlayCircle,
  Plus,
  Radio,
  RefreshCw,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import CreateStudioButton from "@/components/dashboard/CreateStudioButton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/ui/Navbar"
import PlatformIcon from "@/components/ui/PlatformIcon"
import { prisma } from "@/lib/prisma"

interface Props {
  searchParams: Promise<{ error?: string }>
}

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  tiktok: "TikTok",
  twitter: "X",
}

const ALL_PLATFORM_IDS = ["youtube", "twitch", "kick", "tiktok", "twitter"]

async function fetchDashboardData(userId: string) {
  const attempt = async () => {
    const [rooms, platforms, user] = await Promise.all([
      prisma.room.findMany({
        where: { hostId: userId },
        orderBy: { createdAt: "desc" },
        take: 12,
      }),
      prisma.platformConnection.findMany({ where: { userId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { onboardedAt: true },
      }),
    ])
    return { rooms, platforms, user }
  }

  try {
    return { ...(await attempt()), dbError: false }
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (code === "P1001" || code === "P1008") {
      await new Promise((r) => setTimeout(r, 800))
      try {
        return { ...(await attempt()), dbError: false }
      } catch {
        return { rooms: [], platforms: [], user: null, dbError: true }
      }
    }
    return { rooms: [], platforms: [], user: null, dbError: true }
  }
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { error } = await searchParams

  const { rooms, platforms, user, dbError } = await fetchDashboardData(session.user.id)

  // First-run gate: redirect to /onboarding if nothing exists and not yet onboarded
  if (
    !dbError &&
    !user?.onboardedAt &&
    rooms.length === 0 &&
    platforms.length === 0
  ) {
    redirect("/onboarding")
  }

  const liveRooms = rooms.filter((r) => r.status === RoomStatus.LIVE)
  const readyRooms = rooms.filter((r) => r.status === RoomStatus.LOBBY)
  const endedRooms = rooms.filter((r) => r.status === RoomStatus.ENDED)
  const connectedIds = new Set(platforms.map((p) => p.platform.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Auth redirect error banners */}
        {error === "room_not_found" && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm mb-6">
            Studio not found or it belongs to a different account.
          </div>
        )}
        {error === "room_ended" && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm mb-6">
            That studio session has already ended.
          </div>
        )}
        {dbError && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl px-4 py-3 text-sm mb-6 flex items-center justify-between gap-4">
            <span>Database is waking up — please wait a moment and refresh.</span>
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </a>
          </div>
        )}

        {/* Hero */}
        <section className="relative overflow-hidden rounded-2xl border border-white/6 bg-[#0d0d0d] mb-8">
          <div
            aria-hidden
            className="absolute -top-40 -right-32 w-[28rem] h-[28rem] rounded-full pointer-events-none"
            style={{
              background:
                "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 60%)",
            }}
          />
          <div className="relative px-6 sm:px-8 py-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-indigo-300 font-bold mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Studio control
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                {session.user.name?.split(" ")[0]
                  ? `Hey, ${session.user.name.split(" ")[0]}.`
                  : "Welcome back."}
              </h1>
              <p className="text-gray-400 text-sm mt-2 max-w-md">
                {liveRooms.length > 0
                  ? `${liveRooms.length} studio${liveRooms.length === 1 ? "" : "s"} live right now.`
                  : readyRooms.length > 0
                    ? `${readyRooms.length} studio${readyRooms.length === 1 ? "" : "s"} ready to go.`
                    : "Spin up a studio and go live in seconds."}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {liveRooms[0] && (
                <Link href={`/studio/${liveRooms[0].code}`}>
                  <Button
                    variant="outline"
                    className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200"
                  >
                    <Radio className="w-4 h-4 mr-2 animate-pulse" />
                    Rejoin live
                  </Button>
                </Link>
              )}
              <CreateStudioButton />
            </div>
          </div>
        </section>

        {/* Stats strip */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatTile
            icon={<Radio className="w-3.5 h-3.5" />}
            label="Live now"
            value={liveRooms.length}
            tone="emerald"
          />
          <StatTile
            icon={<Video className="w-3.5 h-3.5" />}
            label="Ready"
            value={readyRooms.length}
            tone="indigo"
          />
          <StatTile
            icon={<Clock className="w-3.5 h-3.5" />}
            label="Past sessions"
            value={endedRooms.length}
            tone="muted"
          />
          <StatTile
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Platforms"
            value={`${connectedIds.size}/${ALL_PLATFORM_IDS.length}`}
            tone="muted"
          />
        </section>

        {/* Platforms strip */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
              Platforms
            </h2>
            <Link
              href="/settings/platforms"
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
            >
              <SettingsIcon className="w-3 h-3" />
              Manage
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ALL_PLATFORM_IDS.map((id) => {
              const connected = connectedIds.has(id)
              const conn = platforms.find((p) => p.platform.toLowerCase() === id)
              return (
                <div
                  key={id}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                    connected
                      ? "bg-white/[0.03] border-white/8"
                      : "bg-white/[0.01] border-white/4 opacity-70 hover:opacity-100"
                  }`}
                >
                  <PlatformIcon platform={id} size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white font-medium">{PLATFORM_LABELS[id]}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {connected ? conn?.channelName : "Not connected"}
                    </p>
                  </div>
                  {connected ? (
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  ) : (
                    <Link
                      href="/settings/platforms"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium shrink-0"
                    >
                      Connect
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* Studios */}
        <Suspense
          fallback={
            <div>
              <div className="h-5 w-32 bg-[#111111] rounded animate-pulse mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-28 bg-[#111111] border border-white/6 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          }
        >
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white uppercase tracking-wide">
                Recent studios
              </h2>
              {rooms.length > 0 && (
                <span className="text-xs text-gray-600">{rooms.length} total</span>
              )}
            </div>

            {rooms.length === 0 && !dbError ? (
              <EmptyStudios />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            )}
          </section>
        </Suspense>
      </div>
    </div>
  )
}

// ── Components ─────────────────────────────────────────────────────────────

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  tone: "emerald" | "indigo" | "muted"
}) {
  const toneClasses =
    tone === "emerald"
      ? "text-emerald-400"
      : tone === "indigo"
        ? "text-indigo-400"
        : "text-gray-500"
  return (
    <div className="rounded-xl border border-white/6 bg-[#0d0d0d] px-4 py-3">
      <div className={`flex items-center gap-1.5 text-xs ${toneClasses} mb-1`}>
        {icon}
        <span className="uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function RoomCard({
  room,
}: {
  room: {
    id: string
    code: string
    title: string | null
    status: RoomStatus
    createdAt: Date
  }
}) {
  const live = room.status === RoomStatus.LIVE
  const ready = room.status === RoomStatus.LOBBY
  const ended = room.status === RoomStatus.ENDED

  return (
    <Card className="bg-[#111111] border-white/6 hover:border-white/12 transition-colors overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {room.title ?? `Room ${room.code}`}
            </p>
            <p className="font-mono text-[11px] text-gray-600 tracking-widest uppercase mt-0.5">
              {room.code}
            </p>
          </div>
          <Badge
            variant={ended ? "secondary" : "default"}
            className={
              live
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                : ready
                  ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                  : "bg-gray-500/20 text-gray-500 border-gray-500/30"
            }
          >
            {live ? "Live" : ready ? "Ready" : "Ended"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-2 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(room.createdAt).toLocaleDateString()}
          </span>
        </div>

        {live && (
          <Link href={`/studio/${room.code}`} className="block">
            <Button
              size="sm"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              Rejoin live
            </Button>
          </Link>
        )}
        {ready && (
          <Link href={`/studio/${room.code}`} className="block">
            <Button
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              <PlayCircle className="w-3.5 h-3.5 mr-1.5" />
              Enter studio
            </Button>
          </Link>
        )}
        {ended && (
          <Link
            href={`/session-summary/${room.code}`}
            className="block w-full text-center text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-2 border border-white/6 rounded-md hover:bg-white/[0.03]"
          >
            View summary
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function EmptyStudios() {
  return (
    <Card className="relative overflow-hidden bg-[#111111] border-white/6">
      <div
        aria-hidden
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 60%)",
        }}
      />
      <CardContent className="relative px-8 py-12">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-5">
            <Video className="w-3 h-3" />
            No studios yet
          </div>
          <h3
            className="font-black text-white tracking-tight leading-[1.05] mb-3"
            style={{ fontSize: "clamp(24px, 3vw, 32px)" }}
          >
            Spin up your first studio.
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            Multistream to YouTube, Twitch, Kick, and TikTok from a single browser tab.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { n: "01", icon: Plus, title: "Create a studio", sub: "Name it, get a code." },
            { n: "02", icon: Users, title: "Invite by link", sub: "No guest accounts needed." },
            {
              n: "03",
              icon: SettingsIcon,
              title: "Connect platforms",
              sub: "YT / Twitch / Kick / TikTok.",
            },
          ].map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.n}
                className="rounded-lg border border-white/6 bg-white/[0.02] p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-indigo-400">
                    {step.n}
                  </span>
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <p className="text-white font-semibold text-sm mb-1">{step.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{step.sub}</p>
              </div>
            )
          })}
        </div>

        <CreateStudioButton />
      </CardContent>
    </Card>
  )
}
