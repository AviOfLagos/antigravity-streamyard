import { RoomStatus } from "@prisma/client"
import { getCachedRoom } from "@/lib/room-cache"
import { setRoomInfo } from "@/lib/redis"
import { notFound } from "next/navigation"
import JoinClient from "./JoinClient"

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params

  const room = await getCachedRoom(code)

  if (!room) notFound()

  // Ensure room info exists in Redis (may have expired after 24h TTL)
  await setRoomInfo(code, { hostId: room.hostId, createdAt: room.createdAt.toISOString(), title: room.title }).catch(() => {})

  if (room.status === RoomStatus.ENDED) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Studio Has Ended</h1>
          <p className="text-gray-400">This streaming session has ended.</p>
        </div>
      </div>
    )
  }

  return (
    <JoinClient
      roomCode={code}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
    />
  )
}
