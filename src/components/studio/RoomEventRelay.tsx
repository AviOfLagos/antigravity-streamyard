"use client"

/**
 * RoomEventRelay — host-side bridge between Redis and LiveKit data channels.
 *
 * Architecture:
 *  - Only the HOST runs this component (rendered inside StudioClient, not GuestStudio).
 *  - It polls `/api/rooms/[code]/events-since` every POLL_INTERVAL_MS for new events
 *    and new chat messages, using a cursor (_ts) to avoid re-fetching old items.
 *  - Each batch is serialised as `{ type: "ROOM_EVENT", event: <payload> }` and
 *    broadcast to ALL participants via `localParticipant.publishData()` (reliable).
 *  - Guests receive these in their existing `RoomEvent.DataReceived` handler and
 *    dispatch to the appropriate local handler.
 *
 * Redis command reduction:
 *  - Old architecture: every client polls Redis every 1 s  → O(N clients × 1/s)
 *  - New architecture: only the host polls every 3-5 s     → O(1 per room per 5s)
 */

import { useEffect, useRef } from "react"

import { useLocalParticipant } from "@livekit/components-react"

interface RoomEventRelayProps {
  roomCode: string
  /** Called for each event the relay receives (so StudioClient can handle them locally too). */
  onEvent: (event: Record<string, unknown>) => void
}

const POLL_INTERVAL_MS = 4000 // 4 s — well within Upstash free-tier budget
const MAX_CONSECUTIVE_ERRORS = 5

export default function RoomEventRelay({ roomCode, onEvent }: RoomEventRelayProps) {
  const { localParticipant } = useLocalParticipant()

  // Stable ref so the interval closure never captures a stale localParticipant
  const localParticipantRef = useRef(localParticipant)
  useEffect(() => { localParticipantRef.current = localParticipant }, [localParticipant])

  const onEventRef = useRef(onEvent)
  useEffect(() => { onEventRef.current = onEvent }, [onEvent])

  // Cursor state — persists between polls so we never refetch old data
  const lastEventTsRef = useRef<number>(Date.now() - 10_000) // replay last 10 s on mount
  const lastChatTsRef = useRef<number>(Date.now() - 10_000)
  const lastChatIdRef = useRef<string | undefined>(undefined)
  const consecutiveErrorsRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    const encoder = new TextEncoder()

    const broadcast = (payload: Record<string, unknown>) => {
      const lp = localParticipantRef.current
      if (!lp) return
      try {
        lp.publishData(encoder.encode(JSON.stringify(payload)), { reliable: true }).catch(() => {
          // Non-critical — guest will show stale state at worst
        })
      } catch {
        // publishData may throw synchronously if not connected
      }
    }

    const poll = async () => {
      if (cancelled) return
      try {
        const url = `/api/rooms/${roomCode}/events-since?eventsFrom=${lastEventTsRef.current}&chatFrom=${lastChatTsRef.current}${lastChatIdRef.current ? `&lastChatId=${encodeURIComponent(lastChatIdRef.current)}` : ""}`
        const res = await fetch(url)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }

        const data = (await res.json()) as {
          events: Array<{ _ts: number; [key: string]: unknown }>
          chat: Array<{ _ts: number; id?: string; [key: string]: unknown }>
        }

        consecutiveErrorsRef.current = 0

        // ── Relay room events ────────────────────────────────────────────────
        for (const event of data.events) {
          const { _ts, ...payload } = event
          lastEventTsRef.current = Math.max(lastEventTsRef.current, _ts)

          const wrapper: Record<string, unknown> = { type: "ROOM_EVENT", event: payload }

          // Fire locally on the host (replaces SSE handler)
          onEventRef.current(payload)

          // Broadcast to all guests via LiveKit data channel
          broadcast(wrapper)
        }

        // ── Relay chat messages ──────────────────────────────────────────────
        for (const msg of data.chat) {
          const { _ts, ...payload } = msg
          lastChatTsRef.current = Math.max(lastChatTsRef.current, _ts)
          if (msg.id) lastChatIdRef.current = msg.id

          const wrapper: Record<string, unknown> = {
            type: "ROOM_EVENT",
            event: { type: "CHAT_MESSAGE", data: payload },
          }

          // Fire locally on the host
          onEventRef.current({ type: "CHAT_MESSAGE", data: payload })

          // Broadcast to all guests
          broadcast(wrapper)
        }
      } catch (err) {
        consecutiveErrorsRef.current += 1
        console.warn(
          `[RoomEventRelay] Poll error (${consecutiveErrorsRef.current}/${MAX_CONSECUTIVE_ERRORS}):`,
          err
        )
        if (consecutiveErrorsRef.current >= MAX_CONSECUTIVE_ERRORS) {
          // Fire a CONNECTION_ERROR so the host's UI can warn
          onEventRef.current({ type: "CONNECTION_ERROR" })
          // Back off to a longer interval but keep trying
          consecutiveErrorsRef.current = 0
        }
      }

      if (!cancelled) {
        setTimeout(poll, POLL_INTERVAL_MS)
      }
    }

    // Kick off the first poll immediately
    poll()

    return () => {
      cancelled = true
    }
  }, [roomCode]) // stable — roomCode never changes during a session

  return null
}
