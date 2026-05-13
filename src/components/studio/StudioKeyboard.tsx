"use client"

import { useEffect, useState } from "react"

import { useTrackToggle } from "@livekit/components-react"
import { Track } from "livekit-client"
import { Keyboard, X } from "lucide-react"
import { toast } from "sonner"

interface StudioKeyboardProps {
  /** Toggle the host chat sidebar (desktop) / overlay (mobile). */
  onToggleChat?: () => void
  /** Toggle the backstage panel — guest-only. */
  onToggleBackstage?: () => void
}

interface Shortcut {
  combo: string
  label: string
}

const HOST_SHORTCUTS: Shortcut[] = [
  { combo: "M", label: "Toggle microphone" },
  { combo: "V", label: "Toggle camera" },
  { combo: "C", label: "Toggle chat sidebar" },
  { combo: "?", label: "Show this shortcuts help" },
  { combo: "Esc", label: "Close any open dialog" },
]

function isTypingInField(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true
  if (el.isContentEditable) return true
  return false
}

/**
 * Studio-wide keyboard shortcut layer. Mounted inside LiveKitRoom so
 * useTrackToggle picks up the local mic/cam. Listens to `document keydown`
 * and ignores keystrokes while the host is typing in any input. Triggers
 * a sonner toast on each successful binding so the host gets visual feedback
 * (helps when the shortcut wasn't intentional).
 */
export default function StudioKeyboard({ onToggleChat, onToggleBackstage }: StudioKeyboardProps) {
  const { toggle: toggleMic, enabled: micOn } = useTrackToggle({ source: Track.Source.Microphone })
  const { toggle: toggleCam, enabled: camOn } = useTrackToggle({ source: Track.Source.Camera })
  const [helpOpen, setHelpOpen] = useState(false)

  useEffect(() => {
    const handler = async (e: KeyboardEvent) => {
      if (isTypingInField(e.target)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      // ? help (shift+/ on US keyboards)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault()
        setHelpOpen(true)
        return
      }

      // Esc closes help
      if (e.key === "Escape") {
        if (helpOpen) {
          e.preventDefault()
          setHelpOpen(false)
        }
        return
      }

      // Ignore single shift / capslock presses
      if (e.shiftKey && e.key.length > 1) return

      const k = e.key.toLowerCase()
      if (k === "m") {
        e.preventDefault()
        await toggleMic()
        toast.info(micOn ? "Mic muted" : "Mic on", { duration: 1200 })
      } else if (k === "v") {
        e.preventDefault()
        await toggleCam()
        toast.info(camOn ? "Camera off" : "Camera on", { duration: 1200 })
      } else if (k === "c" && onToggleChat) {
        e.preventDefault()
        onToggleChat()
      } else if (k === "b" && onToggleBackstage) {
        e.preventDefault()
        onToggleBackstage()
      }
    }

    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [toggleMic, toggleCam, onToggleChat, onToggleBackstage, micOn, camOn, helpOpen])

  if (!helpOpen) return null

  // Help modal — rendered on demand. Trap focus on the close button.
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <div className="w-full max-w-sm bg-studio-panel border border-white/10 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
          <Keyboard className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-white flex-1">Keyboard shortcuts</h2>
          <button
            type="button"
            autoFocus
            onClick={() => setHelpOpen(false)}
            aria-label="Close shortcuts help"
            className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/8 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <ul className="px-4 py-3 space-y-2">
          {HOST_SHORTCUTS.map((s) => (
            <li key={s.combo} className="flex items-center justify-between text-xs text-gray-300">
              <span>{s.label}</span>
              <kbd className="px-2 py-0.5 bg-white/10 border border-white/15 rounded text-[11px] font-mono text-white">
                {s.combo}
              </kbd>
            </li>
          ))}
        </ul>
        <p className="px-4 pb-3 text-[10px] text-gray-500">
          Shortcuts ignore keystrokes while you&apos;re typing in an input or textarea.
        </p>
      </div>
    </div>
  )
}
