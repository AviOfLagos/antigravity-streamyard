"use client"

import { useEffect } from "react"

/* Mount once at the root. Hooks window.error + unhandledrejection and POSTs to
   /api/errors. Fail-open: any beacon failure is swallowed silently so logging
   never cascades into user-visible errors. */

const ENDPOINT = "/api/errors"

function send(payload: {
  message: string
  stack?: string
  level?: "error" | "warn"
  context?: Record<string, unknown>
}) {
  try {
    const body = JSON.stringify({
      message: payload.message,
      stack: payload.stack,
      level: payload.level ?? "error",
      url: typeof location !== "undefined" ? location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      context: payload.context,
    })
    // keepalive lets the POST survive a tab navigation/close
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    // never throw from the beacon
  }
}

export function ErrorBeacon() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      const stack =
        event.error && event.error instanceof Error ? event.error.stack : undefined
      send({
        message: event.message || "Unknown error",
        stack,
      })
    }

    function onRejection(event: PromiseRejectionEvent) {
      const reason = event.reason
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection"
      const stack = reason instanceof Error ? reason.stack : undefined
      send({
        message: `Unhandled rejection: ${message}`,
        stack,
      })
    }

    window.addEventListener("error", onError)
    window.addEventListener("unhandledrejection", onRejection)
    return () => {
      window.removeEventListener("error", onError)
      window.removeEventListener("unhandledrejection", onRejection)
    }
  }, [])

  return null
}
