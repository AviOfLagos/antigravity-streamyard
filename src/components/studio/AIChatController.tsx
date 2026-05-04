"use client"

/**
 * AIChatController — host-only, invisible controller component.
 *
 * Monitors incoming chat messages. When a viewer asks a question and the host
 * hasn't responded within `aiChatDelay` seconds, it fires a POST to the
 * /api/rooms/[code]/chat/ai-respond endpoint.
 *
 * Rate limit: at most 1 AI response every 15 seconds.
 * Safety: never responds to other AI messages (prevents loops).
 */

import { useEffect, useRef } from "react"

import { useChatStore } from "@/store/chat"
import { useStudioStore } from "@/store/studio"
import type { ChatMessage } from "@/lib/chat/types"

// Words that strongly suggest a question even without a trailing "?"
const QUESTION_WORDS = ["how", "what", "when", "why", "who", "where", "can", "does", "is", "are", "will", "would", "should", "could"]

function isQuestion(text: string): boolean {
  const lower = text.toLowerCase().trim()
  if (lower.endsWith("?")) return true
  const firstWord = lower.split(/\s+/)[0] ?? ""
  return QUESTION_WORDS.includes(firstWord)
}

interface AIChatControllerProps {
  roomCode: string
}

export default function AIChatController({ roomCode }: AIChatControllerProps) {
  const messages = useChatStore((s) => s.messages)
  const { aiChatEnabled, aiChatContext, aiChatDelay, aiChatReadAloud } = useStudioStore()

  // Track which message IDs we've already scheduled / responded to
  const handledRef = useRef<Set<string>>(new Set())
  // Timestamp of last AI response (rate limit)
  const lastResponseAt = useRef<number>(0)
  // Pending timers: messageId -> setTimeout handle
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Latest values as refs so timers don't capture stale closures
  const enabledRef = useRef(aiChatEnabled)
  const contextRef = useRef(aiChatContext)
  const delayRef = useRef(aiChatDelay)
  const readAloudRef = useRef(aiChatReadAloud)
  useEffect(() => { enabledRef.current = aiChatEnabled }, [aiChatEnabled])
  useEffect(() => { contextRef.current = aiChatContext }, [aiChatContext])
  useEffect(() => { delayRef.current = aiChatDelay }, [aiChatDelay])
  useEffect(() => { readAloudRef.current = aiChatReadAloud }, [aiChatReadAloud])

  // Latest messages as ref for the timer callback to inspect host replies
  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  useEffect(() => {
    if (!aiChatEnabled) return

    // Look at only the newest messages we haven't seen yet
    for (const msg of messages) {
      // Skip if already handled or scheduled
      if (handledRef.current.has(msg.id)) continue
      // Never handle host or AI messages
      if (msg.platform === "host" || msg.platform === "ai") continue
      // Only handle questions
      if (!isQuestion(msg.message)) continue

      handledRef.current.add(msg.id)

      const capturedMsg: ChatMessage = msg
      const delayMs = delayRef.current * 1000

      const timerId = setTimeout(async () => {
        timersRef.current.delete(capturedMsg.id)

        if (!enabledRef.current) return

        // Check if the host has replied since the question was asked
        const questionTs = new Date(capturedMsg.timestamp).getTime()
        const hostReplied = messagesRef.current.some(
          (m) =>
            m.platform === "host" &&
            new Date(m.timestamp).getTime() > questionTs
        )
        if (hostReplied) return

        // Rate limit: max 1 AI response every 15 seconds
        const now = Date.now()
        if (now - lastResponseAt.current < 15_000) return
        lastResponseAt.current = now

        try {
          const res = await fetch(`/api/rooms/${roomCode}/chat/ai-respond`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: capturedMsg.message,
              author: capturedMsg.author.name,
              platform: capturedMsg.platform,
              context: contextRef.current || undefined,
            }),
          })

          if (!res.ok) {
            console.warn(`[AIChatController] ai-respond returned ${res.status}`)
            return
          }

          const data = (await res.json()) as { response?: string }

          // Optional: read the AI response aloud on the host's machine only
          if (readAloudRef.current && data.response && typeof window !== "undefined" && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(data.response)
            utterance.rate = 1.0
            utterance.pitch = 1.0
            window.speechSynthesis.speak(utterance)
          }
        } catch (err) {
          console.error("[AIChatController] fetch error:", err)
        }
      }, delayMs)

      timersRef.current.set(capturedMsg.id, timerId)
    }
  }, [messages, aiChatEnabled, roomCode])

  // Cleanup pending timers on unmount or when AI is disabled
  useEffect(() => {
    if (!aiChatEnabled) {
      for (const timerId of timersRef.current.values()) clearTimeout(timerId)
      timersRef.current.clear()
    }
  }, [aiChatEnabled])

  useEffect(() => {
    // Capture the map reference at effect registration time so the cleanup
    // function uses the same reference even if the ref changes.
    const timers = timersRef.current
    return () => {
      for (const timerId of timers.values()) clearTimeout(timerId)
      timers.clear()
    }
  }, [])

  // This component renders nothing — it is a pure side-effect controller
  return null
}
