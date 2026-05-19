import "server-only"

/**
 * Slack webhook client — realtime ops alerts.
 *
 * Server-only fire-and-forget poster for Slack incoming webhooks. Each webhook
 * URL is bound to a single Slack channel; we route different event types to
 * different env vars so each `postTo*` helper is one-to-one with a channel.
 *
 * Design rules (SPEC V3-style fail-soft):
 *   - Never throws. Caller can `void postBetaSignup(...)` without try/catch.
 *   - Env unset → log once, return false, drop the message.
 *   - Slack 5xx / network error → log + return false. Never propagate.
 *   - 5s timeout via AbortController — Slack normally replies <1s; a long hang
 *     means the network is wedged and the caller path should not be blocked.
 *   - Module-level dedup map prevents a 500-error storm from firing 500 Slack
 *     messages with the same fingerprint.
 *   - Module-level per-URL throttle keeps us under Slack's 1 msg/sec/channel
 *     sustained limit (best-effort only on serverless).
 *
 * No new npm deps — native `fetch` + AbortController only.
 */

// ── Public types ────────────────────────────────────────────────────────────

/**
 * Slack Block Kit blocks are too rich to model exhaustively in TypeScript.
 * Callers craft `Record<string, unknown>` inline and Slack validates server-side.
 */
export type SlackBlock = Record<string, unknown>

export interface SlackPayload {
  /** Fallback text for notifications + screen readers. Required by Slack. */
  text: string
  blocks?: SlackBlock[]
  username?: string
  icon_emoji?: string
}

// ── Module-level state (per-process, per-warm-lambda) ───────────────────────

const DEDUP_WINDOW_MS = 60_000
const DEDUP_MAX_ENTRIES = 500
const MIN_INTERVAL_MS = 200
const THROTTLE_BACKOFF_MS = 250
const SLACK_TIMEOUT_MS = 5_000
const SLACK_HOOK_PREFIX = "https://hooks.slack.com/"

/** fingerprint → lastFiredAtMs. LRU-ish: oldest evicted on overflow. */
const dedupMap = new Map<string, number>()

/** webhookUrl → lastFiredAtMs. Used to space outbound POSTs per channel. */
const lastFiredByUrl = new Map<string, number>()

/** envVarName → already-warned? Prevents log spam when a channel is dark. */
const envUnsetWarned = new Set<string>()

// ── Env wiring (read lazily — never at module init) ─────────────────────────

type ChannelKey =
  | "SLACK_WEBHOOK_BETA_SIGNUPS"
  | "SLACK_WEBHOOK_STREAMS"
  | "SLACK_WEBHOOK_ALERTS"
  | "SLACK_WEBHOOK_DIGEST"

function readWebhook(key: ChannelKey): string | undefined {
  const raw = process.env[key]
  if (!raw || !raw.trim()) {
    if (!envUnsetWarned.has(key)) {
      envUnsetWarned.add(key)
      console.debug(`[slack] ${key} webhook unset; skip`)
    }
    return undefined
  }
  return raw.trim()
}

// ── Dedup + throttle helpers ────────────────────────────────────────────────

function shouldSkipForDedup(fingerprint: string | undefined): boolean {
  if (!fingerprint) return false
  const now = Date.now()
  const last = dedupMap.get(fingerprint)
  if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
    return true
  }
  // Record this fire. Evict oldest if at cap.
  if (!dedupMap.has(fingerprint) && dedupMap.size >= DEDUP_MAX_ENTRIES) {
    const oldestKey = dedupMap.keys().next().value
    if (oldestKey !== undefined) dedupMap.delete(oldestKey)
  } else if (dedupMap.has(fingerprint)) {
    // Re-insert to move to tail (Map iteration order = insertion order).
    dedupMap.delete(fingerprint)
  }
  dedupMap.set(fingerprint, now)
  return false
}

function markFired(webhookUrl: string): void {
  lastFiredByUrl.set(webhookUrl, Date.now())
}

function timeSinceLastFire(webhookUrl: string): number {
  const last = lastFiredByUrl.get(webhookUrl)
  if (last === undefined) return Number.POSITIVE_INFINITY
  return Date.now() - last
}

// ── Core poster ─────────────────────────────────────────────────────────────

async function doPost(webhookUrl: string, payload: SlackPayload): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SLACK_TIMEOUT_MS)
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
    if (!res.ok) {
      const bodySnippet = await res.text().then((t) => t.slice(0, 200)).catch(() => "")
      console.warn(`[slack] non-2xx ${res.status}: ${bodySnippet}`)
      return false
    }
    markFired(webhookUrl)
    return true
  } catch (err) {
    console.warn("[slack] fetch failed:", err instanceof Error ? err.message : String(err))
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Post a payload to a Slack incoming webhook.
 *
 * Returns true only on a 2xx response. Returns false for: unset URL, malformed
 * URL, non-2xx, timeout, network error. Never throws.
 *
 * Per-URL throttle is best-effort — if a second call arrives within
 * MIN_INTERVAL_MS we schedule it via setTimeout (fire-and-forget) so the
 * caller is never blocked. On serverless this only works while the lambda is
 * warm, but that covers the common burst-storm case we care about.
 */
export async function postToSlack(
  webhookUrl: string | undefined,
  payload: SlackPayload,
): Promise<boolean> {
  if (!webhookUrl) return false
  if (!webhookUrl.startsWith(SLACK_HOOK_PREFIX)) {
    console.warn(`[slack] refusing to POST: url does not start with ${SLACK_HOOK_PREFIX}`)
    return false
  }

  const delta = timeSinceLastFire(webhookUrl)
  if (delta < MIN_INTERVAL_MS) {
    // Schedule the send without blocking — best-effort throttle.
    setTimeout(() => {
      void doPost(webhookUrl, payload)
    }, THROTTLE_BACKOFF_MS)
    // Treat as "accepted" for the caller — we did not drop it.
    // But return false so the caller knows it wasn't confirmed delivered.
    return false
  }

  return doPost(webhookUrl, payload)
}

// ── Block Kit conveniences ──────────────────────────────────────────────────

const SEVERITY_EMOJI: Record<string, string> = {
  warn: ":warning:",
  error: ":red_circle:",
  critical: ":rotating_light:",
}

function isoNow(): string {
  return new Date().toISOString()
}

function contextFields(context: Record<string, string | number | boolean>): SlackBlock[] {
  const entries = Object.entries(context)
  if (entries.length === 0) return []
  // Slack "fields" array — pairs of {type:"mrkdwn", text:"*k*\nv"}.
  const fields = entries.map(([k, v]) => ({
    type: "mrkdwn",
    text: `*${k}*\n${String(v)}`,
  }))
  return [{ type: "section", fields }]
}

function alertBlocks(
  severity: string,
  title: string,
  body?: string,
  context?: Record<string, string | number | boolean>,
): SlackBlock[] {
  const emoji = SEVERITY_EMOJI[severity] ?? ":grey_question:"
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${emoji} ${title}`.slice(0, 150), emoji: true },
    },
    { type: "divider" },
  ]
  if (body) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: body.slice(0, 2900) },
    })
  }
  if (context) blocks.push(...contextFields(context))
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `_${isoNow()}_` }],
  })
  return blocks
}

// ── Convenience wrappers ────────────────────────────────────────────────────

/**
 * Beta signup notification — internal channel, but defense-in-depth: no email,
 * no name, no IP. Just the analytics-level facts.
 */
export async function postBetaSignup(args: {
  platform: string
  country: string | null
  utmSource: string | null
  referrer: string | null
}): Promise<boolean> {
  const url = readWebhook("SLACK_WEBHOOK_BETA_SIGNUPS")
  if (!url) return false

  const fields: Record<string, string | number | boolean> = {
    Platform: args.platform || "—",
    Country: args.country ?? "—",
    "UTM source": args.utmSource ?? "—",
    Referrer: args.referrer ?? "—",
  }

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: ":tada: New beta signup", emoji: true },
    },
    ...contextFields(fields),
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `_${isoNow()}_` }],
    },
  ]

  return postToSlack(url, {
    text: `New beta signup (${args.platform})`,
    blocks,
  })
}

/**
 * Stream-started notification — admin-only channel, so hostEmail is OK to surface.
 *
 * No admin link button: there is currently no /admin/streams/[roomCode] route.
 * Adding one is a future enhancement and won't break this caller.
 */
export async function postStreamStarted(args: {
  hostEmail: string
  roomCode: string
  platforms: string[]
  egressId?: string
}): Promise<boolean> {
  const url = readWebhook("SLACK_WEBHOOK_STREAMS")
  if (!url) return false

  const fields: Record<string, string | number | boolean> = {
    Host: args.hostEmail,
    Room: args.roomCode,
    Platforms: args.platforms.length > 0 ? args.platforms.join(", ") : "—",
    "Egress id": args.egressId ?? "—",
  }

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: ":satellite: Stream live", emoji: true },
    },
    ...contextFields(fields),
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `_${isoNow()}_` }],
    },
  ]

  return postToSlack(url, {
    text: `Stream live — ${args.roomCode}`,
    blocks,
  })
}

/**
 * Generic alert — supports dedup via `fingerprint`. Same fingerprint within
 * DEDUP_WINDOW_MS (1 min) is dropped silently. Omit `fingerprint` to fire
 * unconditionally.
 */
export async function postAlert(args: {
  severity: "warn" | "error" | "critical"
  title: string
  body?: string
  context?: Record<string, string | number | boolean>
  fingerprint?: string
}): Promise<boolean> {
  if (shouldSkipForDedup(args.fingerprint)) return false

  const url = readWebhook("SLACK_WEBHOOK_ALERTS")
  if (!url) return false

  const blocks = alertBlocks(args.severity, args.title, args.body, args.context)
  const fallback = `[${args.severity.toUpperCase()}] ${args.title}`

  return postToSlack(url, { text: fallback, blocks })
}

/**
 * Periodic digest poster — placeholder until the Phase 5 cron lands.
 * Wires through to the digest webhook so we can smoke-test the channel
 * before the scheduler exists.
 */
export async function postDigest(args: {
  range: "weekly" | "monthly"
  metrics: Record<string, number | string>
}): Promise<boolean> {
  const url = readWebhook("SLACK_WEBHOOK_DIGEST")
  if (!url) return false

  const title = args.range === "weekly" ? ":bar_chart: Weekly digest" : ":bar_chart: Monthly digest"
  const fields: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(args.metrics)) fields[k] = v

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: title, emoji: true },
    },
    ...contextFields(fields),
    {
      type: "context",
      elements: [{ type: "mrkdwn", text: `_${isoNow()}_` }],
    },
  ]

  return postToSlack(url, {
    text: `${args.range} digest`,
    blocks,
  })
}
