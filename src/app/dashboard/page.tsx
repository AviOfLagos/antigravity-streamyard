import { RoomStatus } from "@prisma/client"
import { Clock, RefreshCw, Video } from "lucide-react"
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
    const rooms = await prisma.room.findMany({
      where: { hostId: userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    const platforms = await prisma.platformConnection.findMany({
      where: { userId },
    })
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
    <div className="min-h-screen bg-gray-950">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <PlatformSummary platforms={platforms} />
        </div>

        {/* Rooms */}
        <h2 className="text-lg font-semibold text-white mb-4">Recent Studios</h2>
        {rooms.length === 0 && !dbError ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-16 text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No studios yet. Create your first one!</p>
              <CreateStudioButton />
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
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                            : "bg-gray-500/20 text-gray-500 border-gray-500/30"
                      }
                    >
                      {room.status === RoomStatus.LOBBY ? "Ready" : room.status === RoomStatus.LIVE ? "Live" : "Ended"}
                    </Badge>
                    {room.status === RoomStatus.LOBBY && (
                      <Link href={`/studio/${room.code}`}>
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white text-xs">
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
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
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
      </div>
    </div>
  )
}
