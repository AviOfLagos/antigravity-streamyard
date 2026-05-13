"use client"

import { useCallback } from "react"

import { Focus, LayoutGrid, Monitor, PictureInPicture2, Square } from "lucide-react"

import { type StudioLayout, useStudioStore } from "@/store/studio"

interface Preset {
  id: StudioLayout
  label: string
  icon: React.ReactNode
}

const PRESETS: Preset[] = [
  { id: "four-grid", label: "Grid", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "spotlight-side-strip", label: "Spotlight", icon: <Focus className="w-4 h-4" /> },
  { id: "screen-with-strip", label: "Scr+Grid", icon: <PictureInPicture2 className="w-4 h-4" /> },
  { id: "screen-presenter-pip", label: "Screen", icon: <Monitor className="w-4 h-4" /> },
  { id: "solo", label: "Single", icon: <Square className="w-4 h-4" /> },
]

export default function LayoutSelector() {
  const activeLayout = useStudioStore((s) => s.activeLayout)
  const setLayout = useStudioStore((s) => s.setLayout)
  const autoLayoutEnabled = useStudioStore((s) => s.autoLayoutEnabled)
  const setAutoLayoutEnabled = useStudioStore((s) => s.setAutoLayoutEnabled)

  // Clicking a layout button in auto mode: switch to that layout and disable auto mode.
  const handleSetLayout = useCallback((layout: StudioLayout) => {
    if (autoLayoutEnabled) setAutoLayoutEnabled(false)
    setLayout(layout)
  }, [setLayout, autoLayoutEnabled, setAutoLayoutEnabled])

  return (
    <div className="flex flex-wrap items-center gap-1" role="radiogroup" aria-label="Stage layout">
      {PRESETS.map((preset) => {
        const isActive = activeLayout === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`${preset.label} layout${autoLayoutEnabled ? " (disables auto layout)" : ""}`}
            onClick={() => handleSetLayout(preset.id)}
            title={autoLayoutEnabled ? `${preset.label} (disables auto layout)` : preset.label}
            className={[
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all text-[10px] font-medium select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-studio-panel",
              isActive
                ? "bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-500/30"
                : "bg-white/4 text-gray-400 hover:text-white",
              // Dim (but still clickable) when auto layout is managing things
              autoLayoutEnabled && !isActive ? "opacity-40" : "",
            ].join(" ")}
          >
            <span aria-hidden="true">{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
