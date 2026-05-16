/* Sentry — Edge runtime (middleware, edge route handlers). Prisma doesn't run
   on edge, so the server-config's Prisma filter is omitted here. Fail-soft
   when SENTRY_DSN is absent. */

import * as Sentry from "@sentry/nextjs"

const dsn = process.env.SENTRY_DSN
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
    enabled: process.env.NODE_ENV !== "test",
  })
}
