import type { LayoutPreset, LayoutPresetId } from "./types"

/**
 * 10 layout presets, modelled on StreamYard / Riverside conventions.
 * All coordinates are percentages of the 1920×1080 virtual canvas.
 *
 * Slot ordering convention:
 *   slot 0 = primary (host / pinned participant)
 *   slot N = additional tiles in tileOrder sequence
 */
export const LAYOUT_PRESETS: Record<LayoutPresetId, LayoutPreset> = {
  solo: {
    id: "solo",
    label: "Solo",
    description: "One person, full canvas",
    slots: [{ x: 0, y: 0, w: 100, h: 100 }],
    autoSelectable: true,
  },
  "two-side": {
    id: "two-side",
    label: "Two side-by-side",
    description: "Two equal tiles, vertical split",
    slots: [
      { x: 0, y: 0, w: 50, h: 100 },
      { x: 50, y: 0, w: 50, h: 100 },
    ],
    autoSelectable: true,
  },
  "three-row": {
    id: "three-row",
    label: "Three in a row",
    description: "Three equal tiles, vertical strips",
    slots: [
      { x: 0, y: 0, w: 33.333, h: 100 },
      { x: 33.333, y: 0, w: 33.333, h: 100 },
      { x: 66.667, y: 0, w: 33.333, h: 100 },
    ],
    autoSelectable: true,
  },
  "four-grid": {
    id: "four-grid",
    label: "Four — 2×2 grid",
    description: "Quad grid",
    slots: [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 },
    ],
    autoSelectable: true,
  },
  "five-grid": {
    id: "five-grid",
    label: "Five — 2 top, 3 bottom",
    description: "Two large on top, three smaller below",
    slots: [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 33.333, h: 50 },
      { x: 33.333, y: 50, w: 33.333, h: 50 },
      { x: 66.667, y: 50, w: 33.333, h: 50 },
    ],
    autoSelectable: true,
  },
  "six-grid": {
    id: "six-grid",
    label: "Six — 3×2 grid",
    description: "Six-up grid",
    slots: [
      { x: 0, y: 0, w: 33.333, h: 50 },
      { x: 33.333, y: 0, w: 33.333, h: 50 },
      { x: 66.667, y: 0, w: 33.333, h: 50 },
      { x: 0, y: 50, w: 33.333, h: 50 },
      { x: 33.333, y: 50, w: 33.333, h: 50 },
      { x: 66.667, y: 50, w: 33.333, h: 50 },
    ],
    autoSelectable: true,
  },
  "spotlight-bottom-strip": {
    id: "spotlight-bottom-strip",
    label: "Spotlight — bottom strip",
    description: "One primary tile, up to 5 thumbnails along the bottom",
    slots: [
      { x: 0, y: 0, w: 100, h: 75 },
      { x: 0, y: 75, w: 20, h: 25 },
      { x: 20, y: 75, w: 20, h: 25 },
      { x: 40, y: 75, w: 20, h: 25 },
      { x: 60, y: 75, w: 20, h: 25 },
      { x: 80, y: 75, w: 20, h: 25 },
    ],
    autoSelectable: true,
  },
  "spotlight-side-strip": {
    id: "spotlight-side-strip",
    label: "Spotlight — side strip",
    description: "One primary tile, up to 4 thumbnails on the right",
    slots: [
      { x: 0, y: 0, w: 75, h: 100 },
      { x: 75, y: 0, w: 25, h: 25 },
      { x: 75, y: 25, w: 25, h: 25 },
      { x: 75, y: 50, w: 25, h: 25 },
      { x: 75, y: 75, w: 25, h: 25 },
    ],
    autoSelectable: true,
  },
  "screen-presenter-pip": {
    id: "screen-presenter-pip",
    label: "Screen + presenter PiP",
    description: "Screenshare full-canvas with presenter overlay bottom-right",
    slots: [
      { x: 0, y: 0, w: 100, h: 100 },  // screenshare
      { x: 78, y: 72, w: 20, h: 25 },  // presenter overlay (drawn last → on top)
    ],
    screenshareSlot: 0,
    autoSelectable: true,
  },
  "screen-with-strip": {
    id: "screen-with-strip",
    label: "Screen + side strip",
    description: "Screenshare large left, up to 4 presenters in side strip",
    slots: [
      { x: 0, y: 0, w: 80, h: 100 },     // screenshare
      { x: 80, y: 0, w: 20, h: 25 },
      { x: 80, y: 25, w: 20, h: 25 },
      { x: 80, y: 50, w: 20, h: 25 },
      { x: 80, y: 75, w: 20, h: 25 },
    ],
    screenshareSlot: 0,
    autoSelectable: true,
  },
}

export const LAYOUT_PRESET_IDS = Object.keys(LAYOUT_PRESETS) as LayoutPresetId[]
