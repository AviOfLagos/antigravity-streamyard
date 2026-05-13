"use client"

import { useMemo } from "react"

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
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
  const tileOrder = useStudioStore((s) => s.tileOrder)
  const setTileOrder = useStudioStore((s) => s.setTileOrder)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Compute drag-aware global participant order
  const sortedParticipants = useMemo(() => {
    const indexOf = (id: string) => {
      const i = tileOrder.indexOf(id)
      return i === -1 ? Number.POSITIVE_INFINITY : i
    }
    const arr = [...participants]
    arr.sort((a, b) => {
      const ai = indexOf(a.identity)
      const bi = indexOf(b.identity)
      if (ai !== bi) return ai - bi
      const aHost = a.identity.startsWith("host-") ? 0 : 1
      const bHost = b.identity.startsWith("host-") ? 0 : 1
      if (aHost !== bHost) return aHost - bHost
      return participants.indexOf(a) - participants.indexOf(b)
    })
    return arr
  }, [participants, tileOrder])

  if (!isHost) return null

  const stageIsOpen = onScreenParticipantIds.length === 0

  // Split sorted participants into on-stage / backstage groups,
  // preserving the global drag order within each group.
  const onStage = stageIsOpen
    ? sortedParticipants
    : sortedParticipants.filter((p) => onScreenParticipantIds.includes(p.identity))

  const backstage = stageIsOpen
    ? []
    : sortedParticipants.filter((p) => !onScreenParticipantIds.includes(p.identity))

  // Only show host when alone — always show the panel for host visibility
  const hasOverflow = participants.length > 4

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = sortedParticipants.findIndex((p) => p.identity === active.id)
    const newIndex = sortedParticipants.findIndex((p) => p.identity === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    const reordered = arrayMove(sortedParticipants, oldIndex, newIndex)
    setTileOrder(reordered.map((p) => p.identity))
  }

  if (participants.length <= 1) {
    return (
      <div className="relative min-h-[5.5rem] bg-studio-bg-deep border-t border-white/6">
        <div
          className="flex items-center gap-2 px-3 py-2 overflow-x-auto min-h-[5.5rem] scroll-smooth"
          role="group"
          aria-label="Participants"
        >
          <div className="flex items-center gap-2 text-gray-400 text-xs mx-auto">
            <Users className="w-3.5 h-3.5" />
            <span>No guests yet — share the invite link</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[5.5rem] bg-studio-bg-deep border-t border-white/6">
      <div
        className="flex items-center gap-2 px-3 py-2 overflow-x-auto min-h-[5.5rem] scroll-smooth"
        role="group"
        aria-label="Participants"
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={sortedParticipants.map((p) => p.identity)}
            strategy={horizontalListSortingStrategy}
          >
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
          </SortableContext>
        </DndContext>
      </div>
      {/* Right-edge scroll affordance — only when participants overflow */}
      {hasOverflow && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-studio-bg-deep to-transparent"
        />
      )}
    </div>
  )
}
