import { RoomStatus } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import JoinClient from "./JoinClient"

interface Props {
  params: Promise<{ code: string }>
}

export default async function JoinPage({ params }: Props) {
  const { code } = await params

  const room = await prisma.room.findUnique({ where: { code } })

  if (!room) notFound()

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
