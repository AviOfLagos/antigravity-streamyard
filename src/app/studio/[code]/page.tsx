import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { generateHostToken } from "@/lib/livekit"
import StudioClient from "./StudioClient"

interface Props {
  params: Promise<{ code: string }>
}

export default async function StudioPage({ params }: Props) {
  const { code } = await params
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) redirect("/dashboard")
  if (room.status === "ended") redirect("/dashboard")

  // Check for sessionStorage token (set by CreateStudioButton) — can't do this server-side
  // Generate a fresh token server-side as fallback
  const hostToken = generateHostToken(code, session.user.id, session.user.name ?? "Host")

  return (
    <StudioClient
      roomCode={code}
      hostToken={hostToken}
      livekitUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL!}
      userName={session.user.name ?? "Host"}
    />
  )
}
