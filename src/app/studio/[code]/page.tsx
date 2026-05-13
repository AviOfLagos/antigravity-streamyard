import { Suspense } from "react"

import { RoomStatus } from "@prisma/client"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import StudioErrorBoundary from "@/components/studio/StudioErrorBoundary"
import { generateHostToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { getCachedRoom } from "@/lib/room-cache"
import { setRoomInfo } from "@/lib/redis"
// F-04: Client wrapper with dynamic import (ssr:false not allowed in server components)
import StudioClientLoader from "./StudioClientLoader"

/** Skeleton loader matching the studio layout dimensions to avoid CLS */
function StudioSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-studio-bg overflow-hidden">
      {/* Header skeleton */}
      <header className="flex-none h-12 flex items-center px-4 bg-studio-bg-deep border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-20 h-4 bg-white/6 rounded animate-pulse" />
          <div className="h-4 w-px bg-white/10" />
          <div className="w-16 h-3 bg-white/4 rounded animate-pulse" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Stage skeleton — matches real frame: toolbar / 16:9 stage / backstage / controlbar */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top toolbar shimmer */}
          <div className="flex-none flex items-center gap-1.5 px-3 py-1.5 bg-studio-bg-deep border-b border-white/6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
          {/* Stage — single 16:9 tile centered (mirrors empty-stage default) */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            <div className="w-full max-w-[1280px] px-3 py-3 h-full flex items-center justify-center">
              <div className="w-full bg-studio-elevated rounded-xl animate-pulse" style={{ aspectRatio: "16/9" }} />
            </div>
          </div>
          {/* Backstage strip shimmer */}
          <div className="min-h-[5.5rem] flex items-center gap-2 px-3 py-2 bg-studio-bg-deep border-t border-white/6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-[5.5rem] flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-full bg-white/10 animate-pulse" />
                <div className="w-12 h-2 bg-white/5 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Control bar shimmer */}
          <div className="h-14 bg-studio-bg-deep border-t border-white/6 flex items-center justify-center gap-2 px-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[52px] h-10 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Chat panel skeleton */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-white/6 bg-studio-bg">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
            <div className="w-3.5 h-3.5 bg-indigo-400/30 rounded-full animate-pulse" />
            <div className="w-16 h-3 bg-white/6 rounded animate-pulse" />
          </div>
          {/* Platform filter shimmer */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-5 w-12 bg-white/4 rounded animate-pulse" />
            ))}
          </div>
          <div className="flex-1 px-3 py-2 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1">
                <div className="h-2.5 w-1/3 bg-white/6 rounded animate-pulse" />
                <div className="h-2 w-2/3 bg-white/4 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  params: Promise<{ code: string }>
}

export default async function StudioPage({ params }: Props) {
  const { code } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) redirect("/dashboard?error=room_not_found")
  if (room.status === RoomStatus.ENDED) redirect("/dashboard?error=room_ended")

  // G16 — guard LiveKit env vars before generating token
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return (
      <div className="flex items-center justify-center h-dvh bg-studio-bg">
        <p className="text-red-400 text-sm">LiveKit environment variables are not configured.</p>
      </div>
    )
  }

  // F-04: Parallelize host token generation, platform data fetch, and Redis room info refresh
  const [hostToken, platformConnections] = await Promise.all([
    generateHostToken(code, session.user.id, session.user.name ?? "Host"),
    prisma.platformConnection.findMany({
      where: { userId: session.user.id },
      select: { platform: true, channelName: true },
    }),
    // Ensure room info exists in Redis (may have expired after 24h TTL)
    setRoomInfo(code, { hostId: session.user.id, createdAt: room.createdAt.toISOString(), title: room.title }).catch(() => {}),
  ])

  const connectedPlatforms = platformConnections.map((p) => ({
    platform: p.platform.toLowerCase(),
    channelName: p.channelName ?? "",
  }))

  return (
    <Suspense fallback={<StudioSkeleton />}>
      <StudioErrorBoundary roomCode={code}>
        <StudioClientLoader
          roomCode={code}
          hostToken={hostToken}
          livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          title={room.title ?? undefined}
          description={room.description ?? undefined}
          connectedPlatforms={connectedPlatforms}
        />
      </StudioErrorBoundary>
    </Suspense>
  )
}
