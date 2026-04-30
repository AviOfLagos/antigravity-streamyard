"use client"

/**
 * AutoLayoutManager — host-only component (must render inside a LiveKitRoom).
 *
 * Monitors participant speaking state and screen-share tracks, then drives the
 * Zustand studio store's `activeLayout` and `pinnedParticipantId` via a
 * conservative debounced state machine.
 *
 * State machine states
 * ─────────────────────
 * IDLE              No actionable activity — keep current layout.
 * SINGLE_SPEAKER    Exactly one participant has been actively speaking for > 2 s.
 * MULTI_SPEAKER     Two or more participants speaking simultaneously.
 * SCREEN_SHARE      At least one ScreenShare track is published.
 *
 * Transition rules (Option A — no mouse-activity tracking)
 * ─────────────────────────────────────────────────────────
 * Any          → SCREEN_SHARE      When a ScreenShare track appears     → layout "screen-grid"
 * SCREEN_SHARE → SINGLE_SPEAKER    Screen share disappears + 1 speaker  → layout "spotlight", pin speaker
 * SCREEN_SHARE → MULTI_SPEAKER     Screen share disappears + 2+ speakers→ layout "grid"
 * SCREEN_SHARE → IDLE              Screen share disappears + 0 speakers  → keep current layout
 * Any          → SINGLE_SPEAKER    1 speaker for > 2 s (no screenshare) → layout "spotlight", pin speaker
 * Any          → MULTI_SPEAKER     2+ speakers (no screenshare)          → layout "grid"
 * SINGLE_SPEAKER → IDLE            Speaker stops for > 5 s               → keep current layout
 *
 * Guards
 * ──────
 * • Minimum 3 seconds between any two layout changes (flicker guard).
 * • A participant is "actively speaking" only if isSpeaking has been true
 *   continuously for ≥ 500 ms (noise debounce via per-participant timers).
 * • When autoLayoutEnabled is false this component is a no-op.
 */

import { useEffect, useRef } from "react"

import { useParticipants, useTracks } from "@livekit/components-react"
import { Track } from "livekit-client"

import { useStudioStore } from "@/store/studio"

// ── Constants ──────────────────────────────────────────────────────────────

/** Minimum ms between two automatic layout changes (flicker guard). */
const MIN_LAYOUT_CHANGE_INTERVAL_MS = 3_000

/** A participant must be speaking continuously for this long to count. */
const SPEAKING_DEBOUNCE_MS = 500

/** A single speaker must hold the floor this long before spotlight triggers. */
const SINGLE_SPEAKER_THRESHOLD_MS = 2_000

/** After the sole speaker stops, wait this long before leaving SINGLE_SPEAKER. */
const SPEAKER_STOP_COOLDOWN_MS = 5_000

// ── State machine types ────────────────────────────────────────────────────

type AutoState = "IDLE" | "SINGLE_SPEAKER" | "MULTI_SPEAKER" | "SCREEN_SHARE"

// ── Component ──────────────────────────────────────────────────────────────

export default function AutoLayoutManager() {
  const participants = useParticipants()
  const screenShareTracks = useTracks([Track.Source.ScreenShare], { onlySubscribed: false })

  const autoLayoutEnabled = useStudioStore((s) => s.autoLayoutEnabled)
  const setLayout = useStudioStore((s) => s.setLayout)
  const setPinned = useStudioStore((s) => s.setPinned)

  // ── Refs (survive re-renders without triggering effects) ──────────────────

  const autoStateRef = useRef<AutoState>("IDLE")
  const lastLayoutChangeRef = useRef<number>(0)

  /**
   * activeSpeakers: identity → timestamp when they first became "confirmed"
   * speakers (after the SPEAKING_DEBOUNCE_MS window).
   */
  const activeSpeakersRef = useRef<Map<string, number>>(new Map())

  /**
   * speakingDebounceTimers: identity → NodeJS.Timeout id.
   * Each timer promotes a candidate speaker to "confirmed" after SPEAKING_DEBOUNCE_MS.
   */
  const speakingDebounceTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /**
   * singleSpeakerTimer: fires after SINGLE_SPEAKER_THRESHOLD_MS to trigger SINGLE_SPEAKER.
   */
  const singleSpeakerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * speakerStopTimer: fires after SPEAKER_STOP_COOLDOWN_MS to transition SINGLE_SPEAKER → IDLE.
   */
  const speakerStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable refs so nested closures always see fresh values without needing to
  // re-run the outer effect on every render.
  const setLayoutRef = useRef(setLayout)
  const setPinnedRef = useRef(setPinned)
  const autoLayoutEnabledRef = useRef(autoLayoutEnabled)

  useEffect(() => { setLayoutRef.current = setLayout }, [setLayout])
  useEffect(() => { setPinnedRef.current = setPinned }, [setPinned])
  useEffect(() => { autoLayoutEnabledRef.current = autoLayoutEnabled }, [autoLayoutEnabled])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const canChangeLayout = (): boolean => {
    return Date.now() - lastLayoutChangeRef.current >= MIN_LAYOUT_CHANGE_INTERVAL_MS
  }

  const applyLayout = (layout: Parameters<typeof setLayout>[0], pin: string | null = null) => {
    if (!canChangeLayout()) return
    lastLayoutChangeRef.current = Date.now()
    setLayoutRef.current(layout)
    setPinnedRef.current(pin)
  }

  const clearSingleSpeakerTimer = () => {
    if (singleSpeakerTimerRef.current) {
      clearTimeout(singleSpeakerTimerRef.current)
      singleSpeakerTimerRef.current = null
    }
  }

  const clearSpeakerStopTimer = () => {
    if (speakerStopTimerRef.current) {
      clearTimeout(speakerStopTimerRef.current)
      speakerStopTimerRef.current = null
    }
  }

  // ── Screen share effect ────────────────────────────────────────────────────

  useEffect(() => {
    if (!autoLayoutEnabledRef.current) return

    const hasScreenShare = screenShareTracks.length > 0

    if (hasScreenShare) {
      // Any → SCREEN_SHARE
      if (autoStateRef.current !== "SCREEN_SHARE") {
        clearSingleSpeakerTimer()
        clearSpeakerStopTimer()
        autoStateRef.current = "SCREEN_SHARE"
        applyLayout("screen-grid", null)
      }
    } else {
      // Screen share ended — fall back based on current speakers
      if (autoStateRef.current === "SCREEN_SHARE") {
        const speakers = Array.from(activeSpeakersRef.current.keys())
        if (speakers.length === 1) {
          autoStateRef.current = "SINGLE_SPEAKER"
          applyLayout("spotlight", speakers[0])
        } else if (speakers.length > 1) {
          autoStateRef.current = "MULTI_SPEAKER"
          applyLayout("grid", null)
        } else {
          autoStateRef.current = "IDLE"
          // Keep current layout — don't switch when nobody is speaking
        }
      }
    }
  // screenShareTracks.length is stable enough to diff on
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screenShareTracks.length])

  // ── Speaking detection effect ──────────────────────────────────────────────

  useEffect(() => {
    if (!autoLayoutEnabledRef.current) return

    // Collect identities that are currently isSpeaking
    const currentlySpeakingIds = new Set(
      participants.filter((p) => p.isSpeaking).map((p) => p.identity)
    )

    // ── Promote new speakers after debounce ──
    for (const identity of currentlySpeakingIds) {
      if (
        !activeSpeakersRef.current.has(identity) &&
        !speakingDebounceTimersRef.current.has(identity)
      ) {
        // Start debounce timer
        const t = setTimeout(() => {
          speakingDebounceTimersRef.current.delete(identity)
          // Only promote if they're still speaking
          if (!autoLayoutEnabledRef.current) return
          activeSpeakersRef.current.set(identity, Date.now())
          evaluateSpeakers()
        }, SPEAKING_DEBOUNCE_MS)
        speakingDebounceTimersRef.current.set(identity, t)
      }
    }

    // ── Demote speakers who stopped ──
    for (const identity of Array.from(activeSpeakersRef.current.keys())) {
      if (!currentlySpeakingIds.has(identity)) {
        // Cancel pending promotion if they hadn't been confirmed yet
        const pendingTimer = speakingDebounceTimersRef.current.get(identity)
        if (pendingTimer) {
          clearTimeout(pendingTimer)
          speakingDebounceTimersRef.current.delete(identity)
        }
        activeSpeakersRef.current.delete(identity)
        evaluateSpeakers()
      }
    }

    // ── Cancel debounce timers for identities no longer speaking ──
    for (const [identity, t] of Array.from(speakingDebounceTimersRef.current.entries())) {
      if (!currentlySpeakingIds.has(identity)) {
        clearTimeout(t)
        speakingDebounceTimersRef.current.delete(identity)
      }
    }
  // We want to re-run whenever the participant list or their speaking state changes.
  // participants is a new array reference on each change, which is what we need.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants])

  // ── State machine evaluation ───────────────────────────────────────────────

  function evaluateSpeakers() {
    if (!autoLayoutEnabledRef.current) return

    // Screen share takes priority — don't touch layout if it's active
    if (autoStateRef.current === "SCREEN_SHARE") return

    const speakers = Array.from(activeSpeakersRef.current.keys())

    if (speakers.length >= 2) {
      // MULTI_SPEAKER
      clearSingleSpeakerTimer()
      clearSpeakerStopTimer()
      if (autoStateRef.current !== "MULTI_SPEAKER") {
        autoStateRef.current = "MULTI_SPEAKER"
        applyLayout("grid", null)
      }
      return
    }

    if (speakers.length === 1) {
      const [identity] = speakers
      clearSpeakerStopTimer()

      if (autoStateRef.current === "SINGLE_SPEAKER") {
        // Already in single-speaker — ensure pinned is correct (speaker may have changed)
        // Only re-pin if it's a different person, but still respect the flicker guard
        applyLayout("spotlight", identity)
        return
      }

      // Queue a SINGLE_SPEAKER transition if we haven't already
      if (!singleSpeakerTimerRef.current) {
        singleSpeakerTimerRef.current = setTimeout(() => {
          singleSpeakerTimerRef.current = null
          if (!autoLayoutEnabledRef.current) return
          const currentSpeakers = Array.from(activeSpeakersRef.current.keys())
          if (currentSpeakers.length === 1) {
            autoStateRef.current = "SINGLE_SPEAKER"
            applyLayout("spotlight", currentSpeakers[0])
          }
        }, SINGLE_SPEAKER_THRESHOLD_MS)
      }
      return
    }

    // 0 speakers
    clearSingleSpeakerTimer()

    if (autoStateRef.current === "SINGLE_SPEAKER") {
      // Start cooldown before going IDLE
      if (!speakerStopTimerRef.current) {
        speakerStopTimerRef.current = setTimeout(() => {
          speakerStopTimerRef.current = null
          if (!autoLayoutEnabledRef.current) return
          // Only move to IDLE if nobody started speaking again
          if (activeSpeakersRef.current.size === 0) {
            autoStateRef.current = "IDLE"
            // Don't switch layout — keep the spotlight layout in place
          }
        }, SPEAKER_STOP_COOLDOWN_MS)
      }
      return
    }

    if (autoStateRef.current === "MULTI_SPEAKER") {
      autoStateRef.current = "IDLE"
      // Don't switch layout
    }
  }

  // ── Reset on auto-layout disabled ─────────────────────────────────────────

  useEffect(() => {
    if (!autoLayoutEnabled) {
      // Cleanup all pending timers when auto mode is turned off
      clearSingleSpeakerTimer()
      clearSpeakerStopTimer()
      // Snapshot ref maps at effect-run time to satisfy react-hooks/exhaustive-deps
      const debounceTimers = speakingDebounceTimersRef.current
      const activeSpeakers = activeSpeakersRef.current
      for (const t of debounceTimers.values()) clearTimeout(t)
      debounceTimers.clear()
      activeSpeakers.clear()
      autoStateRef.current = "IDLE"
    }
  }, [autoLayoutEnabled])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    // Capture ref values at mount time for stable cleanup reference
    const debounceTimers = speakingDebounceTimersRef.current
    return () => {
      clearSingleSpeakerTimer()
      clearSpeakerStopTimer()
      for (const t of debounceTimers.values()) clearTimeout(t)
      debounceTimers.clear()
    }
  }, [])

  // This component renders nothing — it only drives the store.
  return null
}
