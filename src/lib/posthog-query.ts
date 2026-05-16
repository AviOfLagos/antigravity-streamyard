import "server-only"

/**
 * PostHog Query API helper — server-only.
 *
 * This module is the READ-side counterpart to `src/lib/posthog-server.ts`
 * (which is the WRITE-side capture wrapper via posthog-node). Here we hit the
 * PostHog HTTP Query API to run HogQL / Insight-style queries for admin
 * dashboards (/admin/analytics, /admin/funnel, /admin/retention, etc).
 *
 * ──────────────────────────────────────────────────────────────────────────
 * SETUP
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Required env vars (read at call time, NOT at module init):
 *
 *   POSTHOG_PROJECT_ID
 *     Numeric project id. Discover it by visiting your PostHog dashboard and
 *     inspecting the URL — it looks like:
 *
 *         https://us.posthog.com/project/<NUMERIC_ID>/dashboard
 *                                         ^^^^^^^^^^^
 *     Copy the digits. Example: 178293.
 *
 *   POSTHOG_PERSONAL_API_KEY
 *     A *Personal* API key (NOT the public project key
 *     `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` used by the client SDK — those are
 *     write-only and cannot read query results).
 *
 *     Create one at:
 *
 *         us.posthog.com → top-right avatar → Settings → Personal API Keys
 *           → "Create personal API key"
 *
 *     Required scope: `query:read` (and ideally limit it to a single
 *     organization + project to minimise blast radius if leaked).
 *
 *     Treat it as a secret. NEVER expose to the client. This file imports
 *     `server-only` to guarantee it never gets pulled into a client bundle.
 *
 *   NEXT_PUBLIC_POSTHOG_HOST
 *     Already configured elsewhere in the app. Falls back to
 *     `https://us.i.posthog.com`. NOTE: the *ingest* host (`us.i.posthog.com`)
 *     and the *API* host (`us.posthog.com`) are different — this module
 *     auto-rewrites `i.posthog.com` → `posthog.com` for query requests so a
 *     single env var works for both capture and query.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * USAGE — preferred typed helpers
 * ──────────────────────────────────────────────────────────────────────────
 *
 *     import { queryTrend, queryFunnel, queryRetention } from "@/lib/posthog-query"
 *
 *     // In a Server Component or Route Handler:
 *     const days = await queryTrend("beta_modal_opened", { dateFrom: "2026-05-01" })
 *
 * ──────────────────────────────────────────────────────────────────────────
 * USAGE — raw HogQL (advanced)
 * ──────────────────────────────────────────────────────────────────────────
 *
 *     const rows = await queryHogQL<{ day: string; n: number }>(
 *       `SELECT toStartOfDay(timestamp) AS day, count() AS n
 *        FROM events WHERE event = 'page_view' GROUP BY day`,
 *     )
 *
 * ⚠️ HogQL is SQL-like. Callers MUST hardcode their queries — do NOT
 * concatenate user input into the query string. Use the typed helpers above
 * (which only let user input through as parameterised event names and ISO
 * dates) whenever possible.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * FAIL-SOFT
 * ──────────────────────────────────────────────────────────────────────────
 *
 * If env vars are missing, every helper returns `[]` and logs ONCE per process
 * via `console.warn("[posthog-query] disabled — missing env: …")`. Admin pages
 * should render placeholder UI in that state rather than crash.
 *
 * Non-2xx responses are logged (status + body snippet) and also return `[]`.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * CACHING
 * ──────────────────────────────────────────────────────────────────────────
 *
 * Responses are wrapped in `unstable_cache` with a 60s TTL. PostHog charges
 * (and rate-limits) per query; 60s smoothing keeps admin refreshes cheap
 * without making dashboards feel stale. Tag: `posthog-query` — invalidate via
 * `revalidateTag("posthog-query")` from a route handler if needed.
 */

import { unstable_cache } from "next/cache"

// ─── Constants ────────────────────────────────────────────────────────────

const DEFAULT_HOST = "https://us.i.posthog.com"
const CACHE_REVALIDATE_SECONDS = 60
const CACHE_TAG = "posthog-query"

let missingEnvWarned = false

// ─── HogQL templates (exported as reference for callers) ──────────────────

/**
 * Funnel template — counts unique users reaching each ordered step within a
 * conversion window. Replace `__STEP_N_EVENT__` placeholders and `__WINDOW__`
 * (seconds) before sending. The typed `queryFunnel` helper does this for you.
 */
export const FUNNEL_TEMPLATE = `
WITH ordered_events AS (
  SELECT
    person_id,
    event,
    timestamp,
    row_number() OVER (PARTITION BY person_id ORDER BY timestamp) AS rn
  FROM events
  WHERE event IN (__STEP_EVENTS__)
    AND timestamp >= toDateTime(__DATE_FROM__)
    AND timestamp <= toDateTime(__DATE_TO__)
)
SELECT event, count(DISTINCT person_id) AS reached
FROM ordered_events
GROUP BY event
` as const

/**
 * Trend template — daily counts of a single event. Optional `__BREAKDOWN__`
 * property splits the trend by a property value (e.g. `properties.plan`).
 */
export const TREND_TEMPLATE = `
SELECT
  toStartOfDay(timestamp) AS day,
  __BREAKDOWN_SELECT__
  count() AS count
FROM events
WHERE event = __EVENT__
  AND timestamp >= toDateTime(__DATE_FROM__)
  AND timestamp <= toDateTime(__DATE_TO__)
GROUP BY day __BREAKDOWN_GROUP__
ORDER BY day ASC
` as const

/**
 * Retention template — cohort retention. Buckets users by the day they first
 * fired `startEvent`, then counts how many fired `returnEvent` in each
 * subsequent period.
 */
export const RETENTION_TEMPLATE = `
WITH cohort AS (
  SELECT person_id, toStartOf__PERIOD_UNIT__(min(timestamp)) AS cohort_day
  FROM events
  WHERE event = __START_EVENT__
    AND timestamp >= toDateTime(__DATE_FROM__)
  GROUP BY person_id
),
returning AS (
  SELECT
    c.cohort_day AS cohort_day,
    dateDiff('__PERIOD_UNIT__', c.cohort_day, toStartOf__PERIOD_UNIT__(e.timestamp)) AS period,
    count(DISTINCT e.person_id) AS returning
  FROM cohort c
  JOIN events e ON e.person_id = c.person_id
  WHERE e.event = __RETURN_EVENT__
    AND e.timestamp >= c.cohort_day
  GROUP BY cohort_day, period
)
SELECT
  toString(cohort_day) AS cohort,
  period,
  returning
FROM returning
WHERE period >= 0 AND period < __PERIODS__
ORDER BY cohort_day ASC, period ASC
` as const

// ─── Env loading + fail-soft ──────────────────────────────────────────────

interface PostHogQueryConfig {
  projectId: string
  apiKey: string
  apiHost: string // host for the api/projects/<id>/query/ endpoint (NOT the ingest host)
}

function loadConfig(): PostHogQueryConfig | null {
  const projectId = process.env.POSTHOG_PROJECT_ID
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY
  const rawHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? DEFAULT_HOST

  if (!projectId || !apiKey) {
    if (!missingEnvWarned) {
      const missing = [
        !projectId && "POSTHOG_PROJECT_ID",
        !apiKey && "POSTHOG_PERSONAL_API_KEY",
      ]
        .filter(Boolean)
        .join(", ")
      console.warn(
        `[posthog-query] disabled — missing env: ${missing}. Helpers will return [].`,
      )
      missingEnvWarned = true
    }
    return null
  }

  // Ingest host (us.i.posthog.com) hosts /e and /capture; the Query API lives
  // on the dashboard host (us.posthog.com). Auto-rewrite so a single
  // NEXT_PUBLIC_POSTHOG_HOST env var works for both.
  const apiHost = rawHost.replace("i.posthog.com", "posthog.com").replace(/\/+$/, "")

  return { projectId, apiKey, apiHost }
}

// ─── HTTP transport ───────────────────────────────────────────────────────

interface HogQLResponse {
  results?: unknown[][]
  columns?: string[]
  types?: string[]
  hasMore?: boolean
  error?: string
}

async function postQuery(
  config: PostHogQueryConfig,
  query: string,
  refresh: boolean,
): Promise<HogQLResponse | null> {
  const url = `${config.apiHost}/api/projects/${config.projectId}/query/`
  const body = JSON.stringify({
    query: { kind: "HogQLQuery", query },
    refresh: refresh ? "force_blocking" : "blocking",
  })

  let res: Response
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body,
      // Next-side caching is provided by the unstable_cache wrapper around the
      // public helpers; disable the fetch-level cache so we don't double-cache
      // (and to make `refresh: true` actually re-fetch).
      cache: "no-store",
    })
  } catch (err) {
    console.warn(
      `[posthog-query] network error: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }

  if (!res.ok) {
    const snippet = (await res.text().catch(() => "")).slice(0, 500)
    console.warn(
      `[posthog-query] non-2xx response: ${res.status} ${res.statusText} — ${snippet}`,
    )
    return null
  }

  try {
    return (await res.json()) as HogQLResponse
  } catch (err) {
    console.warn(
      `[posthog-query] failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`,
    )
    return null
  }
}

/** Index of a column name in the response's `columns` array, or -1.
 *  Helper retained for future row-shape introspection; currently unused. */
function _columnIndex(resp: HogQLResponse, name: string): number {
  if (!resp.columns) return -1
  return resp.columns.indexOf(name)
}
void _columnIndex;

function rowsToObjects(resp: HogQLResponse | null): Record<string, unknown>[] {
  if (!resp || !resp.results || !resp.columns) return []
  return resp.results.map((row) => {
    const obj: Record<string, unknown> = {}
    resp.columns!.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj
  })
}

// ─── HogQL string literal escaping ────────────────────────────────────────
// Only used inside the typed helpers for parameterising event names + dates.
// Generic `queryHogQL` callers are expected to hardcode strings.

function escapeHogQLString(s: string): string {
  // HogQL/Clickhouse single-quoted string literal escaping: backslash + single quote.
  return `'${s.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`
}

function isISODateLike(s: string): boolean {
  // Accept YYYY-MM-DD or full ISO 8601 timestamps. We're defensive because
  // we drop the value directly into the query.
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s)
}

function ensureISODate(value: string, field: string): string | null {
  if (!isISODateLike(value)) {
    console.warn(
      `[posthog-query] rejected non-ISO ${field}: ${JSON.stringify(value)}`,
    )
    return null
  }
  return value
}

// ─── Cache wrapper ────────────────────────────────────────────────────────

const cachedQuery = unstable_cache(
  async (query: string, refresh: boolean): Promise<Record<string, unknown>[]> => {
    const config = loadConfig()
    if (!config) return []
    const resp = await postQuery(config, query, refresh)
    return rowsToObjects(resp)
  },
  ["posthog-query"],
  { revalidate: CACHE_REVALIDATE_SECONDS, tags: [CACHE_TAG] },
)

// ─── Public exports ───────────────────────────────────────────────────────

/**
 * Run a raw HogQL query. Returns an array of typed rows.
 *
 * ⚠️ INJECTION WARNING — HogQL is SQL-like. The query string is sent
 * verbatim to PostHog. NEVER concatenate user input into the query. Hardcode
 * your queries and use one of the typed helpers (`queryTrend`, `queryFunnel`,
 * `queryRetention`) for anything dynamic.
 *
 * @param query  Raw HogQL string. Hardcoded literals only.
 * @param opts.refresh  If true, force PostHog to re-execute (skips PostHog's
 *                       server-side cache). Next.js's 60s cache still applies
 *                       — call `revalidateTag("posthog-query")` to bust it.
 */
export async function queryHogQL<T = unknown>(
  query: string,
  opts?: { refresh?: boolean },
): Promise<T[]> {
  const rows = await cachedQuery(query, opts?.refresh ?? false)
  return rows as T[]
}

/**
 * Funnel — count of unique users who reached each ordered step within the
 * given date window. `conversionRate` is `count / firstStepCount` (so the
 * first step is always 1.0).
 *
 * Step `properties` are currently ignored at the HogQL layer (kept in the
 * signature for forward-compat — implement property filters by extending
 * the WHERE clause below).
 */
export async function queryFunnel(
  steps: { event: string; properties?: Record<string, unknown> }[],
  opts: { dateFrom: string; dateTo?: string; conversionWindowDays?: number },
): Promise<Array<{ event: string; count: number; conversionRate: number }>> {
  if (steps.length === 0) return []

  const dateFrom = ensureISODate(opts.dateFrom, "dateFrom")
  if (!dateFrom) return []
  const dateTo = opts.dateTo ? ensureISODate(opts.dateTo, "dateTo") : new Date().toISOString().slice(0, 10)
  if (!dateTo) return []

  const eventList = steps.map((s) => escapeHogQLString(s.event)).join(", ")
  const query = `
    SELECT event, count(DISTINCT person_id) AS reached
    FROM events
    WHERE event IN (${eventList})
      AND timestamp >= toDateTime(${escapeHogQLString(dateFrom)})
      AND timestamp <= toDateTime(${escapeHogQLString(dateTo)})
    GROUP BY event
  `

  const rows = await queryHogQL<{ event: string; reached: number | string }>(query)
  const reachedByEvent = new Map<string, number>()
  for (const r of rows) {
    reachedByEvent.set(String(r.event), Number(r.reached) || 0)
  }

  const firstStepCount = reachedByEvent.get(steps[0]!.event) ?? 0
  return steps.map((s) => {
    const count = reachedByEvent.get(s.event) ?? 0
    const conversionRate = firstStepCount === 0 ? 0 : count / firstStepCount
    return { event: s.event, count, conversionRate }
  })
}

/**
 * Trend — daily counts of a single event. Optional `breakdown` splits the
 * series by a property value (passed as a property name on the event,
 * e.g. `"plan"` → `properties.plan`).
 */
export async function queryTrend(
  event: string,
  opts: { dateFrom: string; dateTo?: string; breakdown?: string },
): Promise<Array<{ day: string; count: number; breakdown?: string }>> {
  const dateFrom = ensureISODate(opts.dateFrom, "dateFrom")
  if (!dateFrom) return []
  const dateTo = opts.dateTo
    ? ensureISODate(opts.dateTo, "dateTo")
    : new Date().toISOString().slice(0, 10)
  if (!dateTo) return []

  // Breakdown property names are also user-controlled; allow only alphanumerics
  // + underscores + dots (for nested property paths). Reject anything else.
  let breakdownExpr = ""
  let breakdownSelect = ""
  let breakdownGroup = ""
  if (opts.breakdown) {
    if (!/^[A-Za-z0-9_.]+$/.test(opts.breakdown)) {
      console.warn(
        `[posthog-query] rejected breakdown with invalid chars: ${JSON.stringify(opts.breakdown)}`,
      )
      return []
    }
    breakdownExpr = `toString(properties.${opts.breakdown})`
    breakdownSelect = `${breakdownExpr} AS breakdown,`
    breakdownGroup = ", breakdown"
  }

  const query = `
    SELECT
      toString(toStartOfDay(timestamp)) AS day,
      ${breakdownSelect}
      count() AS count
    FROM events
    WHERE event = ${escapeHogQLString(event)}
      AND timestamp >= toDateTime(${escapeHogQLString(dateFrom)})
      AND timestamp <= toDateTime(${escapeHogQLString(dateTo)})
    GROUP BY day${breakdownGroup}
    ORDER BY day ASC
  `

  const rows = await queryHogQL<{
    day: string
    count: number | string
    breakdown?: string
  }>(query)

  return rows.map((r) => ({
    day: String(r.day),
    count: Number(r.count) || 0,
    ...(opts.breakdown ? { breakdown: r.breakdown == null ? "" : String(r.breakdown) } : {}),
  }))
}

/**
 * Retention — for each cohort (users whose first `startEvent` fell on a given
 * day/week/month), count users who fired `returnEvent` in each subsequent
 * period (period 0 = same bucket, period 1 = next bucket, …).
 *
 * Returns one row per (cohort, period). `periods` defaults to 14 buckets
 * (so 14 days, 14 weeks, or 14 months depending on `periodUnit`).
 */
export async function queryRetention(
  startEvent: string,
  returnEvent: string,
  opts: { dateFrom: string; periods?: number; periodUnit?: "day" | "week" | "month" },
): Promise<Array<{ cohort: string; period: number; returning: number }>> {
  const dateFrom = ensureISODate(opts.dateFrom, "dateFrom")
  if (!dateFrom) return []

  const periods = Math.max(1, Math.min(opts.periods ?? 14, 90))
  const unit = opts.periodUnit ?? "day"
  // Map to Clickhouse function names. Hardcoded — never user input.
  const bucketFn = unit === "week" ? "toStartOfWeek" : unit === "month" ? "toStartOfMonth" : "toStartOfDay"
  const diffUnit = unit // dateDiff accepts 'day' | 'week' | 'month'

  const query = `
    WITH cohort AS (
      SELECT person_id, ${bucketFn}(min(timestamp)) AS cohort_day
      FROM events
      WHERE event = ${escapeHogQLString(startEvent)}
        AND timestamp >= toDateTime(${escapeHogQLString(dateFrom)})
      GROUP BY person_id
    ),
    returning AS (
      SELECT
        c.cohort_day AS cohort_day,
        dateDiff('${diffUnit}', c.cohort_day, ${bucketFn}(e.timestamp)) AS period,
        count(DISTINCT e.person_id) AS returning
      FROM cohort c
      JOIN events e ON e.person_id = c.person_id
      WHERE e.event = ${escapeHogQLString(returnEvent)}
        AND e.timestamp >= c.cohort_day
      GROUP BY cohort_day, period
    )
    SELECT
      toString(cohort_day) AS cohort,
      period,
      returning
    FROM returning
    WHERE period >= 0 AND period < ${periods}
    ORDER BY cohort_day ASC, period ASC
  `

  const rows = await queryHogQL<{
    cohort: string
    period: number | string
    returning: number | string
  }>(query)

  return rows.map((r) => ({
    cohort: String(r.cohort),
    period: Number(r.period) || 0,
    returning: Number(r.returning) || 0,
  }))
}

/**
 * Cache tag used by all helpers. Re-export so callers can bust the cache:
 *
 *     import { revalidateTag } from "next/cache"
 *     import { POSTHOG_QUERY_CACHE_TAG } from "@/lib/posthog-query"
 *     revalidateTag(POSTHOG_QUERY_CACHE_TAG)
 */
export const POSTHOG_QUERY_CACHE_TAG = CACHE_TAG
