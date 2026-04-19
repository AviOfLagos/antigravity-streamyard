import { Suspense } from "react"

import { RoomStatus } from "@prisma/client"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import StudioErrorBoundary from "@/components/studio/StudioErrorBoundary"
import { generateHostToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"
import { setRoomInfo } from "@/lib/redis"
import StudioClient from "./StudioClient"

/** Skeleton loader matching the studio layout dimensions to avoid CLS */
function StudioSkeleton() {
  return (
    <div className="flex flex-col h-dvh bg-[#0d0d0d] overflow-hidden">
      {/* Header skeleton */}
      <header className="flex-none h-12 flex items-center px-4 bg-[#080808] border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-20 h-4 bg-white/6 rounded animate-pulse" />
          <div className="h-4 w-px bg-white/10" />
          <div className="w-16 h-3 bg-white/4 rounded animate-pulse" />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Stage skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-3">
            <div className="grid grid-cols-2 gap-2 h-full content-center">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] rounded-xl aspect-video animate-pulse"
                />
              ))}
            </div>
          </div>
          {/* Control bar skeleton */}
          <div className="h-16 bg-[#080808] border-t border-white/6 flex items-center justify-center gap-3 px-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-10 bg-white/4 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>

        {/* Chat panel skeleton */}
        <div className="hidden lg:flex flex-col w-72 xl:w-80 border-l border-white/6 bg-[#0d0d0d]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/6">
            <div className="w-16 h-3 bg-white/6 rounded animate-pulse" />
          </div>
          <div className="flex-1" />
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

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) redirect("/dashboard?error=room_not_found")
  if (room.status === RoomStatus.ENDED) redirect("/dashboard?error=room_ended")

  // G16 — guard LiveKit env vars before generating token
  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.NEXT_PUBLIC_LIVEKIT_URL) {
    return (
      <div className="flex items-center justify-center h-dvh bg-[#0d0d0d]">
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
        <StudioClient
          roomCode={code}
          hostToken={hostToken}
          livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
          title={room.title ?? undefined}
          connectedPlatforms={connectedPlatforms}
        />
      </StudioErrorBoundary>
    </Suspense>
  )
}
