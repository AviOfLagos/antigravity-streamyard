import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

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
  "rooms:create":       { tokens: 5, window: "1m" },
  "rooms:request":      { tokens: 3, window: "1m" },
  "rooms:chat-connect": { tokens: 2, window: "1m" },
  "platforms:connect":  { tokens: 5, window: "1m" },
  "rooms:stream":       { tokens: 3, window: "1m" },
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  reset: number
}

/**
 * Check rate limit for a given identifier and limiter type.
 * Fail-open: if Redis is unreachable, the request is allowed.
 */
export async function checkRateLimit(
  identifier: string,
  limiterType: string,
): Promise<RateLimitResult> {
  try {
    const config = LIMITER_CONFIGS[limiterType]
    if (!config) {
      // Unknown limiter type — fail open
      return { success: true, remaining: 1, limit: 1, reset: 0 }
    }

    const limiter = getLimiter(limiterType, config.tokens, config.window)
    const result = await limiter.limit(identifier)

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
