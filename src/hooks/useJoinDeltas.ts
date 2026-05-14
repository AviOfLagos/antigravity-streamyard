"use client"

import { useEffect, useRef, useState } from "react"

import { useChatStore } from "@/store/chat"

const STORAGE_KEY = "zc.studio.joins.enabled"
const CHANGE_EVENT = "zc:joins:changed"

export interface JoinDelta {
  /** Lower-cased platform key (matches PLATFORM_META keys). */
  platform: string
  /** Rolling count of join events inside the current window. */
  count: number
}

export function isJoinActivityEnabled(): boolean {
  if (typeof window === "undefined") return true
  try {
    // Default-on; only off when explicitly "0".
    return window.localStorage.getItem(STORAGE_KEY) !== "0"
  } catch {
    return true
  }
}

export function setJoinActivityEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0")
  } catch {
    /* localStorage blocked — preference applies for session only */
  }
  // Same-tab reactivity: localStorage `storage` event only fires cross-tab.
  try {
    window.dispatchEvent(new Event(CHANGE_EVENT))
  } catch {
    /* SSR / no DOM — no listeners to notify */
  }
}

/** Subscribe to changes in the enabled flag from same tab + other tabs. */
export function subscribeJoinActivity(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener()
  }
  window.addEventListener(CHANGE_EVENT, listener)
  window.addEventListener("storage", onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener)
    window.removeEventListener("storage", onStorage)
  }
}

interface UseJoinDeltasOptions {
  /** Rolling window length in ms. Default 30s. */
  windowMs?: number
  /** When false, hook returns an empty array (host disabled join activity). */
  enabled?: boolean
}

/**
 * F-22: rolling-window join-delta aggregator. Watches the chat store for new
 * messages with eventType === "join" and groups them per platform.
 *
 * Returns the current per-platform deltas in arrival order so callers can
 * render small "+N PLATFORM" pulses next to the header platform pills. Stays
 * silent if the host has disabled join activity (zc.studio.joins.enabled).
 */
export default function useJoinDeltas(opts: UseJoinDeltasOptions = {}): JoinDelta[] {
  const windowMs = opts.windowMs ?? 30_000
  const enabled = opts.enabled ?? true

  const messages = useChatStore((s) => s.messages)
  const [deltas, setDeltas] = useState<JoinDelta[]>([])

  // Track index of the last consumed message so we only count new joins.
  const lastIdxRef = useRef(0)
  // Per-platform queue of join timestamps inside the current window.
  const queuesRef = useRef<Map<string, number[]>>(new Map())

  // Reset state when the hook flips disabled — otherwise the count would
  // persist as stale across a host toggle.
  useEffect(() => {
    if (!enabled) {
      setDeltas([])
      queuesRef.current.clear()
      lastIdxRef.current = messages.length
    }
  }, [enabled, messages.length])

  // Drain new messages once per render: for each new "join" event, push the
  // timestamp into the platform's queue.
  useEffect(() => {
    if (!enabled) return
    const newSlice = messages.slice(lastIdxRef.current)
    lastIdxRef.current = messages.length
    if (newSlice.length === 0) return
    let mutated = false
    const now = Date.now()
    for (const m of newSlice) {
      if (m.eventType !== "join") continue
      const platform = m.platform.toLowerCase()
      const q = queuesRef.current.get(platform) ?? []
      q.push(now)
      queuesRef.current.set(platform, q)
      mutated = true
    }
    if (mutated) {
      setDeltas(snapshot(queuesRef.current, now, windowMs))
    }
  }, [messages, enabled, windowMs])

  // Tick every 2s to evict stale entries — gives the delta pill a natural
  // fade rhythm without re-rendering on every chat message.
  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      const now = Date.now()
      setDeltas(snapshot(queuesRef.current, now, windowMs))
    }, 2_000)
    return () => clearInterval(id)
  }, [enabled, windowMs])

  return deltas
}

function snapshot(
  queues: Map<string, number[]>,
  now: number,
  windowMs: number,
): JoinDelta[] {
  const cutoff = now - windowMs
  const out: JoinDelta[] = []
  for (const [platform, q] of queues) {
    // Trim expired entries in-place to keep memory bounded.
    while (q.length > 0 && q[0] < cutoff) q.shift()
    if (q.length === 0) {
      queues.delete(platform)
      continue
    }
    out.push({ platform, count: q.length })
  }
  return out
}
