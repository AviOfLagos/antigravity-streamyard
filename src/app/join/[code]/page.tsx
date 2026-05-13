import { RoomStatus } from "@prisma/client"
import { getCachedRoom } from "@/lib/room-cache"
import { setRoomInfo } from "@/lib/redis"
import { notFound, redirect } from "next/navigation"
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
    // F-26: route ended rooms to the public recap instead of a generic
    // interstitial. Server redirect so SEO + share previews land on the
    // recap (acquisition surface).
    redirect(`/recap/${code}`)
  }

  return (
    <JoinClient
      roomCode={code}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
    />
  )
}
