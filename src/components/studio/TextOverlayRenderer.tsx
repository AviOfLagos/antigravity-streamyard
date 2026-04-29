"use client"

import { useEffect, useState } from "react"

import { useStudioStore } from "@/store/studio"
import type { TextOverlay } from "@/store/studio"

interface TextOverlayRendererProps {
  overlays: TextOverlay[]
}

const POSITION_CLASSES: Record<TextOverlay["position"], string> = {
  top: "top-4 left-1/2 -translate-x-1/2",
  bottom: "bottom-4 left-1/2 -translate-x-1/2",
  "top-left": "top-4 left-4",
  "top-right": "top-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "bottom-right": "bottom-4 right-4",
}

const FONT_SIZE_CLASSES: Record<TextOverlay["fontSize"], string> = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
}

export default function TextOverlayRenderer({ overlays }: TextOverlayRendererProps) {
  const toggleTextOverlay = useStudioStore((s) => s.toggleTextOverlay)
  // Tick every second to re-evaluate expiry
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-hide expired overlays (runs on every render)
  const now = Date.now()
  for (const overlay of overlays) {
    if (overlay.visible && overlay.expiresAt !== null && now > overlay.expiresAt) {
      toggleTextOverlay(overlay.id)
    }
  }

  const visible = overlays.filter((o) => o.visible && o.text.trim().length > 0)
  if (visible.length === 0) return null

  return (
    <>
      {visible.map((overlay) => (
        <div
          key={overlay.id}
          className={`absolute z-10 pointer-events-none ${POSITION_CLASSES[overlay.position]}`}
        >
          <span
            className={`inline-block rounded-full px-3 py-1 font-medium leading-snug whitespace-pre-wrap break-words max-w-xs text-center ${FONT_SIZE_CLASSES[overlay.fontSize]}`}
            style={{
              color: overlay.color,
              backgroundColor: overlay.bgColor,
            }}
          >
            {overlay.text}
          </span>
        </div>
      ))}
    </>
  )
}
