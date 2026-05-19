/* Next.js native instrumentation hook. Captures server-side errors from
   App Router routes (render, API, server actions, middleware) and persists
   them via src/lib/errors.recordError. Viewable at /admin/errors.

   Sentry is layered alongside the homegrown beacon: register() loads the
   appropriate runtime config, and onRequestError fans out to BOTH sinks so
   we keep the in-app /admin/errors view AND get Sentry's stack-trace UI.
   PostHog handles client exceptions — no sentry.client.config.ts here. */

import * as Sentry from "@sentry/nextjs"

import { postAlert } from "@/lib/slack"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

export async function onRequestError(
  error: { digest?: string } & Error,
  request: {
    path: string
    method: string
    headers: Record<string, string | string[] | undefined>
  },
  context: {
    routerKind: "Pages Router" | "App Router"
    routePath: string
    routeType: "render" | "route" | "action" | "middleware"
  },
) {
  // Fan out to Sentry first (cheap, non-blocking on its side). Guard against
  // Sentry being unconfigured (no DSN) — captureRequestError is a no-op then.
  try {
    Sentry.captureRequestError(error, request, context)
  } catch {
    // fail open — never let observability errors break the request path
  }

  // Preserve the homegrown beacon: persist to /admin/errors via recordError.
  try {
    const { recordError } = await import("@/lib/errors")
    await recordError({
      side: "server",
      level: "error",
      message: error.message || "Unknown server error",
      stack: error.stack,
      url: request.path,
      context: {
        method: request.method,
        routeType: context.routeType,
        routePath: context.routePath,
        digest: error.digest,
      },
    })
  } catch {
    // fail open
  }

  // Third sink: Slack alert (ERROR level only — warn would spam). Fire-and-forget
  // so it never delays the request path. Fingerprint dedupes a flood from one
  // broken route within the helper's 60s window.
  try {
    const errMessage = error instanceof Error ? error.message : String(error)
    void postAlert({
      severity: "error",
      title: `Server error: ${errMessage.slice(0, 120)}`,
      body:
        error instanceof Error && error.stack
          ? `\`\`\`\n${error.stack.slice(0, 500)}\n\`\`\``
          : undefined,
      context: {
        path: request?.path ?? "unknown",
        method: request?.method ?? "unknown",
        routerKind: context?.routerKind ?? "unknown",
      },
      fingerprint: `${request?.path ?? "unknown"}:${errMessage.slice(0, 50)}`,
    }).catch((slackErr) => console.warn("[slack] alert failed:", slackErr))
  } catch {
    // fail open — observability must never break the request path
  }
}
