import { Suspense } from "react"

import { RoomStatus } from "@prisma/client"
import {
  ArrowRight,
  Clock,
  PlayCircle,
  Plus,
  RefreshCw,
  Settings as SettingsIcon,
  Users,
  Video,
} from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import CreateStudioButton from "@/components/dashboard/CreateStudioButton"
import PlatformSummary from "@/components/dashboard/PlatformSummary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Navbar from "@/components/ui/Navbar"
import { prisma } from "@/lib/prisma"

interface Props {
  searchParams: Promise<{ error?: string }>
}

async function fetchDashboardData(userId: string) {
  const attempt = async () => {
    // F-04: Parallelize DB queries instead of sequential awaits
    const [rooms, platforms] = await Promise.all([
      prisma.room.findMany({
        where: { hostId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.platformConnection.findMany({
        where: { userId },
      }),
    ])
    return { rooms, platforms }
  }

  try {
    return { ...(await attempt()), dbError: false }
  } catch (e: unknown) {
    // On connection error, wait briefly for Neon to wake, then retry once
    const code = (e as { code?: string })?.code
    if (code === "P1001" || code === "P1008") {
      await new Promise(r => setTimeout(r, 800))
      try {
        return { ...(await attempt()), dbError: false }
      } catch {
        return { rooms: [], platforms: [], dbError: true }
      }
    }
    return { rooms: [], platforms: [], dbError: true }
  }
}

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { error } = await searchParams

  const { rooms, platforms, dbError } = await fetchDashboardData(session.user.id)

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">

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

        {/* Database error — transient Neon connection issue */}
        {dbError && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl px-4 py-3 text-sm mb-6 flex items-center justify-between gap-4">
            <span>{"Database is waking up — please wait a moment and refresh."}</span>
            <a href="/dashboard" className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-medium shrink-0">
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </a>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Studio</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {session.user.name?.split(" ")[0]}</p>
          </div>
          <CreateStudioButton />
        </div>

        {/* F-04: Suspense boundary — platform summary */}
        <Suspense fallback={
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[#111111] border border-white/6 rounded-xl animate-pulse" />
            ))}
          </div>
        }>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <PlatformSummary platforms={platforms} />
          </div>
        </Suspense>

        {/* F-04: Suspense boundary — rooms list */}
        <Suspense fallback={
          <div>
            <div className="h-5 w-32 bg-[#111111] rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-[#111111] border border-white/6 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        }>
        {/* Rooms */}
        <h2 className="text-lg font-semibold text-white mb-4">Recent Studios</h2>
        {rooms.length === 0 && !dbError ? (
          <Card className="relative overflow-hidden bg-[#111111] border-white/6">
            {/* Brand glow — top-right */}
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 60%)",
              }}
            />
            <CardContent className="relative px-8 py-14">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-5">
                  <Video className="w-3 h-3" />
                  First studio
                </div>
                <h3
                  className="font-black text-white tracking-tight leading-[1.05] mb-3"
                  style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}
                >
                  Take 90 seconds.
                </h3>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Multistream to YouTube, Twitch, Kick, and TikTok — all from a
                  single browser tab. No OBS, no downloads, no hardware.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {[
                  {
                    n: "01",
                    icon: Plus,
                    title: "Create a studio",
                    sub: "Name it, get a code.",
                  },
                  {
                    n: "02",
                    icon: Users,
                    title: "Invite guests by link",
                    sub: "No accounts needed.",
                  },
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
                      <p className="text-white font-semibold text-sm mb-1">
                        {step.title}
                      </p>
                      <p className="text-gray-500 text-xs leading-relaxed">
                        {step.sub}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <CreateStudioButton />
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <PlayCircle className="w-4 h-4" />
                  See what&apos;s in the studio
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-gray-900 border-gray-800">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{room.title ?? `Room ${room.code}`}</p>
                      <p className="font-mono text-xs text-gray-600 tracking-widest">{room.code}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={room.status === RoomStatus.ENDED ? "secondary" : "default"}
                      className={
                        room.status === RoomStatus.LIVE
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : room.status === RoomStatus.LOBBY
                            ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                            : "bg-gray-500/20 text-gray-500 border-gray-500/30"
                      }
                    >
                      {room.status === RoomStatus.LOBBY ? "Ready" : room.status === RoomStatus.LIVE ? "Live" : "Ended"}
                    </Badge>
                    {room.status === RoomStatus.LOBBY && (
                      <Link href={`/studio/${room.code}`}>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                          Enter Studio
                        </Button>
                      </Link>
                    )}
                    {room.status === RoomStatus.LIVE && (
                      <Link href={`/studio/${room.code}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs">
                          Rejoin Live
                        </Button>
                      </Link>
                    )}
                    {room.status === RoomStatus.ENDED && (
                      <Link
                        href={`/session-summary/${room.code}`}
                        className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        Summary
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </Suspense>
      </div>
    </div>
  )
}
