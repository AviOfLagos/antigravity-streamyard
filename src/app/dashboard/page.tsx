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

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { error } = await searchParams

  // Run sequentially to avoid exhausting Neon's serverless connection pool.
  // Promise.all with multiple concurrent queries causes P1001 on the free tier.
  let rooms: Awaited<ReturnType<typeof prisma.room.findMany>> = []
  let platforms: Awaited<ReturnType<typeof prisma.platformConnection.findMany>> = []
  let dbError = false

  try {
    rooms = await prisma.room.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    platforms = await prisma.platformConnection.findMany({
      where: { userId: session.user.id },
    })
  } catch {
    dbError = true
  }

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
            <span>{"Couldn't reach the database. This is usually a brief cold-start on Neon's free tier."}</span>
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
                      <p className="text-white font-medium font-mono">Room {room.code}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={room.status === "active" ? "default" : "secondary"}>
                      {room.status}
                    </Badge>
                    {room.status === "ended" && (
                      <Link
                        href={`/session-summary/${room.code}`}
                        className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                      >
                        Summary
                      </Link>
                    )}
                    {room.status === "active" && (
                      <Link href={`/studio/${room.code}`}>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600">Enter Studio</Button>
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
