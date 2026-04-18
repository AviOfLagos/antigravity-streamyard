"use client"

import { useParticipants } from "@livekit/components-react"
import type { Participant } from "livekit-client"

import { useStudioStore } from "@/store/studio"

interface ParticipantRowProps {
  participant: Participant
  isOnStage: boolean
}

function ParticipantRow({ participant, isOnStage }: ParticipantRowProps) {
  const { bringOnStage, sendToBackstage } = useStudioStore()
  const displayName = participant.name ?? participant.identity ?? "Guest"
  const initial = displayName.charAt(0).toUpperCase()
  const micOn = participant.isMicrophoneEnabled
  const camOn = participant.isCameraEnabled

  return (
    <div className="flex flex-col items-center gap-1 shrink-0 w-20">
      {/* Avatar */}
      <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white select-none shrink-0">
        {initial}
        {/* Mic dot */}
        <span
          className={[
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-[#080808]",
            micOn ? "bg-emerald-400" : "bg-gray-600",
          ].join(" ")}
          title={micOn ? "Mic on" : "Mic off"}
        />
      </div>

      {/* Name */}
      <span className="text-[10px] text-gray-400 truncate w-full text-center leading-tight">
        {displayName}
      </span>

      {/* Cam indicator */}
      <span className={["text-[9px]", camOn ? "text-emerald-400" : "text-gray-600"].join(" ")}>
        {camOn ? "Cam on" : "Cam off"}
      </span>

      {/* Stage / Backstage button */}
      {isOnStage ? (
        <button
          type="button"
          onClick={() => sendToBackstage(participant.identity)}
          className="bg-white/6 text-gray-400 hover:bg-white/10 hover:text-white px-2 py-0.5 rounded text-[9px] transition-colors"
        >
          Backstage
        </button>
      ) : (
        <button
          type="button"
          onClick={() => bringOnStage(participant.identity)}
          className="bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 px-2 py-0.5 rounded text-[9px] transition-colors"
        >
          Stage
        </button>
      )}
    </div>
  )
}

interface BackstagePanelProps {
  isHost?: boolean
}

export default function BackstagePanel({ isHost }: BackstagePanelProps) {
  const participants = useParticipants()
  const { onScreenParticipantIds } = useStudioStore()

  if (!isHost) return null

  const stageIsOpen = onScreenParticipantIds.length === 0

  // Split participants into on-stage / backstage groups
  const onStage = stageIsOpen
    ? participants
    : participants.filter((p) => onScreenParticipantIds.includes(p.identity))

  const backstage = stageIsOpen
    ? []
    : participants.filter((p) => !onScreenParticipantIds.includes(p.identity))

  const allParticipants = [...backstage, ...onStage]

  if (allParticipants.length === 0) return null

  return (
    <div className="h-20 flex items-center gap-2 px-3 bg-[#080808] border-t border-white/6 overflow-x-auto">
      {backstage.map((p) => (
        <ParticipantRow key={p.identity} participant={p} isOnStage={false} />
      ))}
      {onStage.map((p) => (
        <ParticipantRow key={p.identity} participant={p} isOnStage={true} />
      ))}
    </div>
  )
}
