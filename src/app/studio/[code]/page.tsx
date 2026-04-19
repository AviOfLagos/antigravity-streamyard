import { RoomStatus } from "@prisma/client"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { generateHostToken } from "@/lib/livekit"
import { prisma } from "@/lib/prisma"

import StudioClient from "./StudioClient"

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

  const hostToken = await generateHostToken(code, session.user.id, session.user.name ?? "Host")

  return (
    <StudioClient
      roomCode={code}
      hostToken={hostToken}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      title={room.title ?? undefined}
    />
  )
}
