"use client"

import { Focus, LayoutGrid, Monitor, PictureInPicture2, Square } from "lucide-react"

import { type StudioLayout, useStudioStore } from "@/store/studio"

interface Preset {
  id: StudioLayout
  label: string
  icon: React.ReactNode
}

const PRESETS: Preset[] = [
  { id: "grid", label: "Grid", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "spotlight", label: "Spotlight", icon: <Focus className="w-4 h-4" /> },
  { id: "screen-grid", label: "Scr+Grid", icon: <PictureInPicture2 className="w-4 h-4" /> },
  { id: "screen-only", label: "Screen", icon: <Monitor className="w-4 h-4" /> },
  { id: "single", label: "Single", icon: <Square className="w-4 h-4" /> },
]

export default function LayoutSelector() {
  const { activeLayout, setLayout } = useStudioStore()

  return (
    <div className="hidden sm:flex items-center gap-1">
      {PRESETS.map((preset) => {
        const isActive = activeLayout === preset.id
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => setLayout(preset.id)}
            className={[
              "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors text-[10px] font-medium select-none",
              isActive
                ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                : "bg-white/4 text-gray-500 hover:text-white",
            ].join(" ")}
            title={preset.label}
          >
            {preset.icon}
            <span>{preset.label}</span>
          </button>
        )
      })}
    </div>
  )
}
