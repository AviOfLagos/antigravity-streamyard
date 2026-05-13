import { redis } from "./redis"

/* Lightweight error reporter — Redis ring buffer of the last MAX entries.
   Used by /api/errors (client-side beacon) and instrumentation.ts
   (Next.js onRequestError, server-side). Viewable at /admin/errors. */

const KEY = "errors:recent"
const MAX = 200

export type ErrorLevel = "error" | "warn"
export type ErrorSide = "client" | "server"

export interface ErrorRecord {
  ts: number
  level: ErrorLevel
  side: ErrorSide
  message: string
  stack?: string
  url?: string
  userAgent?: string
  email?: string
  context?: Record<string, unknown>
}

export async function recordError(
  rec: Omit<ErrorRecord, "ts">,
): Promise<void> {
  const entry: ErrorRecord = { ts: Date.now(), ...rec }
  try {
    await redis.lpush(KEY, JSON.stringify(entry))
    await redis.ltrim(KEY, 0, MAX - 1)
  } catch {
    // Fail open — never throw from inside the error logger.
  }
}

export async function getRecentErrors(limit = 100): Promise<ErrorRecord[]> {
  try {
    const items = (await redis.lrange(KEY, 0, limit - 1)) as unknown[]
    const parsed: ErrorRecord[] = []
    for (const item of items) {
      if (typeof item === "string") {
        try {
          parsed.push(JSON.parse(item) as ErrorRecord)
        } catch {
          // skip malformed entry
        }
      } else if (item && typeof item === "object") {
        // Upstash JSON-mode may auto-parse; trust the shape.
        parsed.push(item as ErrorRecord)
      }
    }
    return parsed
  } catch {
    return []
  }
}

export async function clearErrors(): Promise<void> {
  try {
    await redis.del(KEY)
  } catch {
    // fail open
  }
}
