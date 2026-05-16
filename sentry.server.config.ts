/* Sentry — Node.js server runtime (App Router SSR, route handlers, server
   actions). PostHog handles client-side exceptions; do NOT add a
   sentry.client.config.ts here or you'll double-report. Fail-soft when
   SENTRY_DSN is absent so local dev and previews stay quiet. */

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: process.env.NODE_ENV !== "test",
    // Filter out noisy errors we don't care about (e.g. handled Prisma retries).
    beforeSend(event, hint) {
      const error = hint.originalException
      if (error instanceof Error) {
        // Suppress retryable Prisma errors caught by our retry wrapper.
        if (
          error.message?.includes("P1001") ||
          error.message?.includes("Can't reach database server")
        ) {
          return null
        }
      }
      return event
    },
  })
}
