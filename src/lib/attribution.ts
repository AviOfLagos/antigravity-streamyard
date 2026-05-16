/**
 * ── Client-side marketing attribution capture ──────────────────────────────
 *
 * Purpose
 * -------
 * Capture both **first-touch** and **last-touch** marketing attribution data
 * on the visitor's browser so we can credit signups to the campaigns and
 * referrers that brought them in.
 *
 * Storage model
 * -------------
 * Everything lives in a single localStorage entry under the key
 * `zerocast:attribution:v1` as a JSON-serialized object. Bump the version
 * suffix (`:v2`, `:v3`, …) if the persisted schema ever changes — do not
 * migrate, just supersede; stale entries get ignored by callers reading the
 * new key.
 *
 * First-touch vs last-touch semantics
 * -----------------------------------
 * - **First-touch** fields (`firstReferrer`, `firstLandingPage`, `firstUtm*`,
 *   `firstSeenAt`) are written exactly once per browser. Once present, they
 *   are never overwritten until {@link clearAttribution} is called. They
 *   answer: "what brought this visitor in the first time?"
 * - **Last-touch** fields (`referrer`, `landingPage`, `utm*`, `lastSeenAt`)
 *   update on every call to {@link captureAttribution} where the current
 *   URL has at least one UTM param OR `document.referrer` is non-empty and
 *   external. They answer: "what brought this visitor on the visit that
 *   converted?" Last-touch expires after 30 days and is reset on next call.
 *
 * When to call each export
 * ------------------------
 * - {@link captureAttribution}: call from a top-level marketing layout's
 *   `useEffect(() => { captureAttribution() }, [])` on every marketing page
 *   mount. Idempotent.
 * - {@link getAttribution}: call inside `BetaModal.handleSubmit()` (or any
 *   conversion handler) and spread the returned payload into the POST body
 *   sent to the beta-signup endpoint.
 * - {@link clearAttribution}: call after a successful beta signup
 *   (`beta_modal_success`) so repeat visits from the same browser don't
 *   keep echoing stale UTMs onto future events.
 *
 * Example
 * -------
 * ```ts
 * // src/app/(marketing)/layout.tsx — top-level marketing layout
 * "use client"
 * import { useEffect } from "react"
 * import { captureAttribution } from "@/lib/attribution"
 *
 * export default function MarketingLayout({ children }) {
 *   useEffect(() => { captureAttribution() }, [])
 *   return <>{children}</>
 * }
 *
 * // src/components/BetaModal.tsx — consumer on submit
 * import { getAttribution, clearAttribution } from "@/lib/attribution"
 *
 * async function handleSubmit(form) {
 *   const attribution = getAttribution()
 *   const res = await fetch("/api/beta", {
 *     method: "POST",
 *     headers: { "content-type": "application/json" },
 *     body: JSON.stringify({ ...form, ...attribution }),
 *   })
 *   if (res.ok) clearAttribution()
 * }
 * ```
 *
 * Privacy note
 * ------------
 * This module uses localStorage only — no cookies, no third-party persistence,
 * no cross-site tracking. The values stored are first-party functional data
 * (the visitor's own UTM parameters and HTTP Referer header as it arrived at
 * our site) used solely to attribute the visitor's own beta signup. All
 * persisted strings are truncated to 200 chars to bound storage growth and
 * landing pages are stored as pathname only (no query, no fragment) to avoid
 * accidental capture of PII embedded in URLs.
 */

const STORAGE_KEY = "zerocast:attribution:v1"

/** Max length of any persisted string field. */
const MAX_FIELD_LENGTH = 200

/** Last-touch expiry window in milliseconds (30 days). */
const LAST_TOUCH_TTL_MS = 30 * 24 * 60 * 60 * 1000

export interface AttributionPayload {
  // First touch
  firstReferrer: string | null
  firstLandingPage: string | null
  firstUtmSource: string | null
  firstUtmMedium: string | null
  firstUtmCampaign: string | null
  firstUtmTerm: string | null
  firstUtmContent: string | null
  firstSeenAt: string | null // ISO 8601

  // Last touch (current session's most recent values)
  referrer: string | null
  landingPage: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
  lastSeenAt: string | null
}

/** All-nulls payload used for SSR safety and uninitialized state. */
function emptyPayload(): AttributionPayload {
  return {
    firstReferrer: null,
    firstLandingPage: null,
    firstUtmSource: null,
    firstUtmMedium: null,
    firstUtmCampaign: null,
    firstUtmTerm: null,
    firstUtmContent: null,
    firstSeenAt: null,
    referrer: null,
    landingPage: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmTerm: null,
    utmContent: null,
    lastSeenAt: null,
  }
}

/** Slice + null-coerce; returns null if input is empty/null/undefined. */
function sanitize(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, MAX_FIELD_LENGTH)
}

/** Type guard for the persisted shape — tolerates partial/legacy entries. */
function isPayloadShape(value: unknown): value is Partial<AttributionPayload> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Safely read & parse the stored payload, returning a fresh empty one on any failure. */
function readStored(): AttributionPayload {
  if (typeof window === "undefined") return emptyPayload()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyPayload()
    const parsed: unknown = JSON.parse(raw)
    if (!isPayloadShape(parsed)) return emptyPayload()
    // Merge over an empty payload so missing keys default to null and we
    // never trust unexpected types from disk.
    const base = emptyPayload()
    const keys = Object.keys(base) as Array<keyof AttributionPayload>
    for (const k of keys) {
      const v = parsed[k]
      if (typeof v === "string") {
        base[k] = sanitize(v)
      }
    }
    return base
  } catch {
    return emptyPayload()
  }
}

/** Persist; swallow QuotaExceededError and any other storage failures silently. */
function writeStored(payload: AttributionPayload): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage may be disabled, full, or in private mode — fail closed.
  }
}

interface UtmParams {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmTerm: string | null
  utmContent: string | null
}

/** Read UTM params from the current URL's query string. */
function readUtmFromUrl(): UtmParams {
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: sanitize(params.get("utm_source")),
    utmMedium: sanitize(params.get("utm_medium")),
    utmCampaign: sanitize(params.get("utm_campaign")),
    utmTerm: sanitize(params.get("utm_term")),
    utmContent: sanitize(params.get("utm_content")),
  }
}

/** True if any UTM field is non-null. */
function hasAnyUtm(utm: UtmParams): boolean {
  return (
    utm.utmSource !== null ||
    utm.utmMedium !== null ||
    utm.utmCampaign !== null ||
    utm.utmTerm !== null ||
    utm.utmContent !== null
  )
}

/**
 * Return `document.referrer` unless it's empty or originates from our own
 * site (internal navigation). Internal nav must never overwrite the real
 * external source.
 */
function readExternalReferrer(): string | null {
  const ref = document.referrer
  if (!ref) return null
  if (ref.startsWith(window.location.origin)) return null
  return sanitize(ref)
}

/** Current pathname only — no query, no fragment — to avoid PII in URLs. */
function readLandingPath(): string | null {
  return sanitize(window.location.pathname)
}

/** True if `lastSeenAt` is missing, unparseable, or older than 30 days. */
function isLastTouchExpired(lastSeenAt: string | null): boolean {
  if (!lastSeenAt) return true
  const t = Date.parse(lastSeenAt)
  if (Number.isNaN(t)) return true
  return Date.now() - t > LAST_TOUCH_TTL_MS
}

/**
 * Capture attribution from the current page. Idempotent: safe to call on
 * every marketing page mount.
 *
 * - First-touch fields are written ONCE (never overwritten while present).
 * - Last-touch fields update when the current URL has any UTM param OR
 *   `document.referrer` is a non-empty external referrer.
 * - Last-touch expires after 30 days; an expired record is cleared and
 *   re-populated on the next call that has signal.
 *
 * SSR-safe: no-ops on the server.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return

  const stored = readStored()
  const now = new Date().toISOString()
  const utm = readUtmFromUrl()
  const referrer = readExternalReferrer()
  const landingPage = readLandingPath()
  const hasUtm = hasAnyUtm(utm)
  const hasSignal = hasUtm || referrer !== null

  const next: AttributionPayload = { ...stored }

  // ── First-touch (sticky — write once, never overwrite) ──
  const firstTouchAbsent = next.firstSeenAt === null
  if (firstTouchAbsent) {
    next.firstReferrer = referrer
    next.firstLandingPage = landingPage
    next.firstUtmSource = utm.utmSource
    next.firstUtmMedium = utm.utmMedium
    next.firstUtmCampaign = utm.utmCampaign
    next.firstUtmTerm = utm.utmTerm
    next.firstUtmContent = utm.utmContent
    next.firstSeenAt = now
  }

  // ── Last-touch (expire + refresh) ──
  if (isLastTouchExpired(next.lastSeenAt)) {
    next.referrer = null
    next.landingPage = null
    next.utmSource = null
    next.utmMedium = null
    next.utmCampaign = null
    next.utmTerm = null
    next.utmContent = null
    next.lastSeenAt = null
  }

  if (hasSignal) {
    next.referrer = referrer
    next.landingPage = landingPage
    next.utmSource = utm.utmSource
    next.utmMedium = utm.utmMedium
    next.utmCampaign = utm.utmCampaign
    next.utmTerm = utm.utmTerm
    next.utmContent = utm.utmContent
    next.lastSeenAt = now
  } else if (firstTouchAbsent) {
    // Brand-new visitor with no UTMs and no external referrer — seed
    // last-touch with the current landing page so we at least know they
    // arrived, even if we don't know how.
    next.landingPage = landingPage
    next.lastSeenAt = now
  }

  writeStored(next)
}

/**
 * Read the current attribution state. Returns an all-nulls payload if
 * nothing is captured yet or if called during SSR. Never throws.
 */
export function getAttribution(): AttributionPayload {
  if (typeof window === "undefined") return emptyPayload()
  return readStored()
}

/**
 * Clear all attribution state. Call after a successful conversion (e.g.
 * `beta_modal_success`) so repeat visits from the same browser don't keep
 * echoing stale UTMs onto future events.
 *
 * SSR-safe: no-ops on the server.
 */
export function clearAttribution(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
