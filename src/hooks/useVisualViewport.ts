"use client"

import { useEffect, useState } from "react"

interface VisualViewportState {
  /** Visible viewport height in px. Defaults to window.innerHeight when API absent. */
  height: number
  /** Pixels the visual viewport is shifted up by (typically by the on-screen keyboard). */
  offsetTop: number
  /** True when the virtual keyboard / visual-viewport shrink is in effect. */
  keyboardOpen: boolean
}

/**
 * Subscribes to the Visual Viewport API so consumers can react to the mobile
 * software keyboard pushing content off-screen. Falls back to window.innerHeight
 * when the API is not available (older browsers, server render).
 *
 * Mobile Safari and Chrome shrink `visualViewport.height` when the on-screen
 * keyboard opens but leave `window.innerHeight` unchanged, so anything pinned
 * with bottom-* positioning ends up behind the keyboard. Use this hook's
 * `keyboardOpen` flag or `height` to reposition floating elements.
 */
export default function useVisualViewport(): VisualViewportState {
  const [state, setState] = useState<VisualViewportState>(() => {
    if (typeof window === "undefined") return { height: 0, offsetTop: 0, keyboardOpen: false }
    return {
      height: window.innerHeight,
      offsetTop: 0,
      keyboardOpen: false,
    }
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      // 100px threshold avoids false positives from URL bar shrink / fullscreen tweaks.
      const keyboardOpen = window.innerHeight - vv.height > 100
      setState({
        height: vv.height,
        offsetTop: vv.offsetTop,
        keyboardOpen,
      })
    }

    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])

  return state
}
