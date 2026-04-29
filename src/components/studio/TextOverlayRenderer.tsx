"use client"

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
