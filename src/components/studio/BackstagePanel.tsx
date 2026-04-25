"use client"

import { useParticipants } from "@livekit/components-react"
import { Users } from "lucide-react"

import ParticipantRow from "@/components/studio/ParticipantRow"
import { useStudioStore } from "@/store/studio"

interface BackstagePanelProps {
  isHost?: boolean
  roomCode: string
  hostToken?: string
}

export default function BackstagePanel({ isHost, roomCode, hostToken }: BackstagePanelProps) {
  const participants = useParticipants()
  const onScreenParticipantIds = useStudioStore((s) => s.onScreenParticipantIds)

  if (!isHost) return null

  const stageIsOpen = onScreenParticipantIds.length === 0

  // Split participants into on-stage / backstage groups
  const onStage = stageIsOpen
    ? participants
    : participants.filter((p) => onScreenParticipantIds.includes(p.identity))

  const backstage = stageIsOpen
    ? []
    : participants.filter((p) => !onScreenParticipantIds.includes(p.identity))

  // Only show host when alone — always show the panel for host visibility
  return (
    <div className="min-h-[5.5rem] flex items-center gap-2 px-3 py-2 bg-[#080808] border-t border-white/6 overflow-x-auto">
      {participants.length <= 1 ? (
        <div className="flex items-center gap-2 text-gray-600 text-xs mx-auto">
          <Users className="w-3.5 h-3.5" />
          <span>No guests yet — share the invite link</span>
        </div>
      ) : (
        <>
          {backstage.map((p) => (
            <ParticipantRow
              key={p.identity}
              participant={p}
              isOnStage={false}
              roomCode={roomCode}
              hostToken={hostToken}
            />
          ))}
          {onStage.map((p) => (
            <ParticipantRow
              key={p.identity}
              participant={p}
              isOnStage={true}
              roomCode={roomCode}
              hostToken={hostToken}
            />
          ))}
        </>
      )}
    </div>
  )
}
