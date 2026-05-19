import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import { prisma } from "@/lib/prisma"
import { postAlert } from "@/lib/slack"

// Spike detection thresholds — when an identifier exceeds SPIKE_THRESHOLD hits
// within SPIKE_WINDOW_MS, fire a warn-level Slack alert. The alert helper
// dedupes by fingerprint within 60s so we don't re-alert on every hit.
const SPIKE_THRESHOLD = 20
const SPIKE_WINDOW_MS = 5 * 60_000

// ── Redis instance for rate limiting (reuses same Upstash credentials) ──────

function getRateLimitRedis(): Redis {
  return new Redis({
    url: (process.env.UPSTASH_REDIS_REST_URL ?? "").trim(),
    token: (process.env.UPSTASH_REDIS_REST_TOKEN ?? "").trim(),
  })
}

// ── Rate limiter instances (sliding window) ─────────────────────────────────

const limiters: Record<string, Ratelimit> = {}

function getLimiter(type: string, tokens: number, window: string): Ratelimit {
  if (!limiters[type]) {
    limiters[type] = new Ratelimit({
      redis: getRateLimitRedis(),
      limiter: Ratelimit.slidingWindow(tokens, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
      prefix: `ratelimit:${type}`,
    })
  }
  return limiters[type]
}

// ── Limiter configurations ──────────────────────────────────────────────────

const LIMITER_CONFIGS: Record<string, { tokens: number; window: string }> = {
  "rooms:create":       { tokens: 5,  window: "1m" },
  "rooms:request":      { tokens: 3,  window: "1m" },
  "rooms:chat-connect": { tokens: 2,  window: "1m" },
  "platforms:connect":  { tokens: 5,  window: "1m" },
  "rooms:stream":       { tokens: 3,  window: "1m" },
  "rooms:record":       { tokens: 5,  window: "60s" },
  "guest:chat-send":    { tokens: 10, window: "30s" },
  // Phase 4 — generous limits for host-only endpoints
  "rooms:admit":        { tokens: 30, window: "1m" },
  "rooms:deny":         { tokens: 30, window: "1m" },
  "rooms:end":          { tokens: 10, window: "1m" },
  "rooms:pause":        { tokens: 10, window: "1m" },
  "rooms:viewer-counts":{ tokens: 30, window: "1m" },
  "rooms:reconnect":    { tokens: 10, window: "1m" },
  "rooms:kick":         { tokens: 30, window: "1m" },
  "rooms:mute":         { tokens: 30, window: "1m" },
  "rooms:leave":        { tokens: 30, window: "1m" },
  "rooms:chat-send":    { tokens: 30, window: "1m" },
  "rooms:ai-respond":   { tokens: 20, window: "1m" },
  "rooms:events-since": { tokens: 60, window: "1m" },
  "rooms:state":        { tokens: 60, window: "1m" },
  "platforms:disconnect":{ tokens: 20, window: "1m" },
  "platforms:refresh":  { tokens: 20, window: "1m" },
  "platforms:custom-rtmp":{ tokens: 10, window: "1m" },
  "feedback:submit":    { tokens: 5,  window: "1m" },
  "errors:ingest":      { tokens: 30, window: "1m" },
  "onboarding:complete":{ tokens: 5,  window: "1m" },
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  reset: number
}

/**
 * Optional per-request context recorded on RateLimitHit rows.
 * All fields are optional — when omitted, the persisted row has nulls in
 * those columns (identifier + limiterType + createdAt are always set).
 */
export interface RateLimitContext {
  route?: string
  method?: string
  userAgent?: string | null
  country?: string | null
}

/**
 * Persist a RateLimitHit row — fire-and-forget. Never awaited, never blocks
 * the 429 response. DB write failures are swallowed (logged via console.warn)
 * to preserve fail-open guarantees.
 */
function recordHit(
  identifier: string,
  limiterType: string,
  context?: RateLimitContext,
): void {
  try {
    void prisma.rateLimitHit
      .create({
        data: {
          identifier,
          limiterType,
          route: context?.route ?? null,
          method: context?.method ?? null,
          userAgent: context?.userAgent ?? null,
          country: context?.country ?? null,
        },
      })
      .catch((err: unknown) => console.warn("[rate-limit] persist failed:", err))

    // Spike check — fire-and-forget. If this identifier has crossed the spike
    // threshold within the rolling window, emit a warn-level Slack alert.
    // Wrapped in its own IIFE so the count query never blocks the 429 response.
    void (async () => {
      try {
        const count = await prisma.rateLimitHit.count({
          where: {
            identifier,
            createdAt: { gte: new Date(Date.now() - SPIKE_WINDOW_MS) },
          },
        })
        if (count >= SPIKE_THRESHOLD) {
          await postAlert({
            severity: "warn",
            title: `Rate-limit spike: ${identifier}`,
            body: `${count} hits in last 5 min`,
            context: { identifier, limiterType, count },
            fingerprint: `spike:${identifier}`,
          })
        }
      } catch (err) {
        console.warn("[rate-limit] spike check failed:", err)
      }
    })()
  } catch (err) {
    // Defensive: if prisma client itself blows up at call time
    // (e.g. missing env, broken init), do NOT propagate.
    console.warn("[rate-limit] persist threw synchronously:", err)
  }
}

/**
 * Check rate limit for a given identifier and limiter type.
 * Fail-open: if Redis is unreachable, the request is allowed.
 *
 * When throttled (success=false), a RateLimitHit row is persisted via
 * fire-and-forget — DB write failures never block the 429 response.
 */
export async function checkRateLimit(
  identifier: string,
  limiterType: string,
  context?: RateLimitContext,
): Promise<RateLimitResult> {
  try {
    const config = LIMITER_CONFIGS[limiterType]
    if (!config) {
      // Unknown limiter type — fail open
      return { success: true, remaining: 1, limit: 1, reset: 0 }
    }

    const limiter = getLimiter(limiterType, config.tokens, config.window)
    const result = await limiter.limit(identifier)

    if (!result.success) {
      // fire-and-forget log; never block the 429 response.
      recordHit(identifier, limiterType, context)
    }

    return {
      success: result.success,
      remaining: result.remaining,
      limit: result.limit,
      reset: result.reset,
    }
  } catch (err) {
    // Fail open — never block legitimate users because rate limiter is broken
    console.warn("[RateLimit] Redis error, failing open:", err)
    return { success: true, remaining: 1, limit: 1, reset: 0 }
  }
}

/**
 * Extract client IP from request headers (Vercel sets x-forwarded-for).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take the first (client) IP
    return forwarded.split(",")[0].trim()
  }
  return "unknown"
}

/**
 * Build a RateLimitContext from a Request — convenience for route handlers
 * that want to opt-in to per-hit observability. User-Agent is truncated to
 * 500 chars to match the schema column.
 */
export function rateLimitContextFromRequest(req: Request): RateLimitContext {
  return {
    route: new URL(req.url).pathname,
    method: req.method,
    userAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    country: req.headers.get("x-vercel-ip-country") ?? null,
  }
}

/**
 * Rate-limit guard — returns a 429 NextResponse if over limit, or null if allowed.
 * Attaches standard rate-limit headers on the 429 response.
 */
export async function rateLimitGuard(
  identifier: string,
  limiterType: string,
  context?: RateLimitContext,
): Promise<Response | null> {
  const rl = await checkRateLimit(identifier, limiterType, context)
  if (!rl.success) {
    const { NextResponse } = await import("next/server")
    const retryAfter = Math.ceil((rl.reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: "Too many requests", retryAfter },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      },
    )
  }
  return null
}
