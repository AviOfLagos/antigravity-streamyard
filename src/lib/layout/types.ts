/**
 * Fixed virtual canvas — 1920×1080 logical pixels. UI uses CSS transform:scale()
 * to fit viewport. Compositor egress renders at native canvas size.
 */
export const CANVAS_WIDTH = 1920
export const CANVAS_HEIGHT = 1080
export const CANVAS_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT // 16:9

/**
 * A slot is a rectangular region in % of the virtual canvas. Origin (0,0) is
 * top-left. Tile content (video) is letterboxed inside the slot to preserve
 * the source aspect ratio.
 */
export interface Slot {
  x: number       // 0–100
  y: number       // 0–100
  w: number       // 0–100
  h: number       // 0–100
}

/** Identifier matching `StudioLayout` in src/store/studio.ts. */
export type LayoutPresetId =
  | "solo"
  | "two-side"
  | "three-row"
  | "four-grid"
  | "five-grid"
  | "six-grid"
  | "spotlight-bottom-strip"
  | "spotlight-side-strip"
  | "screen-presenter-pip"
  | "screen-with-strip"

export interface LayoutPreset {
  id: LayoutPresetId
  label: string
  description: string
  /** Ordered tile slots. Tile 0 is the primary slot (host / pinned). */
  slots: Slot[]
  /**
   * If defined, this slot index is reserved for a screenshare track. Other
   * tiles fill the remaining slots in order. If undefined, screenshares are
   * treated like camera tiles.
   */
  screenshareSlot?: number
  /**
   * If true, the preset can be picked by the auto-layout state machine.
   * Screen-* presets are auto-selected only when a screenshare exists.
   */
  autoSelectable: boolean
}
