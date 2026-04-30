import { RoomStatus } from "@prisma/client"
import Link from "next/link"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import SessionSummaryClient from "./SessionSummaryClient"

interface Props {
  params: Promise<{ code: string }>
}

export interface SessionSummary {
  code: string
  endedAt: string
  durationSeconds: number
  participantCount: number
  peakParticipants: number
  messageCount: number
  platforms: string[]
}

export default async function SessionSummaryPage({ params }: Props) {
  const { code } = await params

  // G25 — Belt-and-suspenders auth check (middleware is the first line of defence)
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  // G26 — Safe JSON parse
  const raw = await redis.get(`session:summary:${code}`)
  let summary: SessionSummary | null = null
  if (raw) {
    try {
      summary = typeof raw === "string" ? JSON.parse(raw) : (raw as SessionSummary)
    } catch {
      summary = null
    }
  }

  // G25 — Verify the room belongs to this user
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room || room.hostId !== session.user.id) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-white font-semibold text-lg mb-2">Access denied</p>
          <p className="text-gray-400 text-sm mb-6">
            You don&apos;t have permission to view this session summary.
          </p>
          <Link
            href="/dashboard"
            className="text-violet-400 hover:text-violet-300 text-sm underline underline-offset-4"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // G27 — DB fallback when Redis key has expired — query Participant records for stats
  let limitedStats = false
  if (!summary && room.hostId === session.user.id && room.status === RoomStatus.ENDED && room.endedAt) {
    const participants = await prisma.participant.findMany({
      where: { roomId: room.id },
    })
    const durationMs = room.endedAt.getTime() - room.createdAt.getTime()
    summary = {
      code,
      endedAt: room.endedAt.toISOString(),
      durationSeconds: Math.floor(durationMs / 1000),
      participantCount: participants.length,
      peakParticipants: participants.length,
      messageCount: 0,
      platforms: [],
    }
    // Only mark as limited if we had no participants recorded (legacy rooms)
    limitedStats = participants.length === 0
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl font-semibold mb-2">Session not found</p>
          <p className="text-gray-400 text-sm mb-6">
            This session summary has expired or does not exist.
          </p>
          <Link
            href="/dashboard"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-4 text-sm transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <SessionSummaryClient summary={summary} limitedStats={limitedStats} />
}
