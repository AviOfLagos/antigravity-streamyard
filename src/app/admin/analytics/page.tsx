import Link from "next/link";
import {
  Activity,
  Users,
  UserPlus,
  Percent,
  Radio,
  TrendingUp,
  Compass,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { queryHogQL, queryTrend } from "@/lib/posthog-query";

export const dynamic = "force-dynamic";

// ─── Sub-navigation strip ─────────────────────────────────────────────────
const SUB_NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/posthog", label: "PostHog" },
] as const;

// ─── Time windows (computed once per request) ─────────────────────────────
const DAY_MS = 24 * 60 * 60 * 1000;
const now = () => new Date();
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

// ─── HogQL queries (hardcoded — no user input) ────────────────────────────
const HOGQL_VISITORS_7D = `
  SELECT count(DISTINCT distinct_id) AS visitors
  FROM events
  WHERE event = '$pageview'
    AND timestamp >= now() - INTERVAL 7 DAY
`;

const HOGQL_VISITORS_PRIOR_7D = `
  SELECT count(DISTINCT distinct_id) AS visitors
  FROM events
  WHERE event = '$pageview'
    AND timestamp >= now() - INTERVAL 14 DAY
    AND timestamp <  now() - INTERVAL 7 DAY
`;

const HOGQL_STREAMS_STARTED_7D = `
  SELECT count() AS started
  FROM events
  WHERE event = 'stream_started'
    AND timestamp >= now() - INTERVAL 7 DAY
`;

const HOGQL_STREAMS_STARTED_PRIOR_7D = `
  SELECT count() AS started
  FROM events
  WHERE event = 'stream_started'
    AND timestamp >= now() - INTERVAL 14 DAY
    AND timestamp <  now() - INTERVAL 7 DAY
`;

// ─── Helpers ──────────────────────────────────────────────────────────────

type CountRow = Record<string, number | string | null | undefined>;

function firstNumber(rows: CountRow[]): number | null {
  if (!rows || rows.length === 0) return null;
  const row = rows[0];
  if (!row) return null;
  const first = Object.values(row)[0];
  if (first == null) return null;
  const n = Number(first);
  return Number.isFinite(n) ? n : null;
}

function formatBigNumber(n: number | null): string {
  if (n == null) return "—";
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

function formatDelta(current: number | null, prior: number | null): string {
  if (current == null || prior == null) return "—";
  if (prior === 0) {
    if (current === 0) return "—";
    return "new";
  }
  const pct = ((current - prior) / prior) * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}% w/w`;
}

function deltaTone(current: number | null, prior: number | null): string {
  if (current == null || prior == null || prior === 0) return "text-ink-faint";
  if (current > prior) return "text-brand-soft";
  if (current < prior) return "text-ink-muted";
  return "text-ink-faint";
}

// ─── Data fetchers (fail-soft at the boundary) ────────────────────────────

async function fetchVisitors7d(): Promise<number | null> {
  try {
    const rows = await queryHogQL<CountRow>(HOGQL_VISITORS_7D);
    return firstNumber(rows);
  } catch {
    return null;
  }
}

async function fetchVisitorsPrior7d(): Promise<number | null> {
  try {
    const rows = await queryHogQL<CountRow>(HOGQL_VISITORS_PRIOR_7D);
    return firstNumber(rows);
  } catch {
    return null;
  }
}

async function fetchStreams7d(): Promise<number | null> {
  try {
    const rows = await queryHogQL<CountRow>(HOGQL_STREAMS_STARTED_7D);
    return firstNumber(rows);
  } catch {
    return null;
  }
}

async function fetchStreamsPrior7d(): Promise<number | null> {
  try {
    const rows = await queryHogQL<CountRow>(HOGQL_STREAMS_STARTED_PRIOR_7D);
    return firstNumber(rows);
  } catch {
    return null;
  }
}

async function fetchDailyTrend28d(): Promise<
  Array<{ day: string; count: number }>
> {
  try {
    const dateFrom = daysAgo(28).toISOString().slice(0, 10);
    const rows = await queryTrend("$pageview", { dateFrom });
    return rows;
  } catch {
    return [];
  }
}

async function fetchSignupsLast(days: number): Promise<number> {
  return prisma.betaRequest.count({
    where: { createdAt: { gte: daysAgo(days) } },
  });
}

async function fetchSources30d(): Promise<
  Array<{ utmSource: string | null; count: number }>
> {
  const rows = await prisma.betaRequest.groupBy({
    by: ["utmSource"],
    where: { createdAt: { gte: daysAgo(30) } },
    _count: { _all: true },
    orderBy: { _count: { utmSource: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({
    utmSource: r.utmSource,
    count: r._count._all,
  }));
}

// ─── Sparkline (hand-rolled inline SVG) ───────────────────────────────────

function Sparkline({
  data,
  width = 800,
  height = 120,
}: {
  data: Array<{ day: string; count: number }>;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;

  const padX = 8;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const counts = data.map((d) => d.count);
  const max = Math.max(1, ...counts);
  const n = data.length;

  const xFor = (i: number) =>
    n === 1 ? padX + innerW / 2 : padX + (i / (n - 1)) * innerW;
  const yFor = (v: number) => padY + innerH - (v / max) * innerH;

  const points = data
    .map((d, i) => `${xFor(i).toFixed(2)},${yFor(d.count).toFixed(2)}`)
    .join(" ");

  // Area path (closed polygon down to baseline) for soft fill.
  const baseY = padY + innerH;
  const areaPath = [
    `M ${xFor(0).toFixed(2)},${baseY.toFixed(2)}`,
    ...data.map(
      (d, i) => `L ${xFor(i).toFixed(2)},${yFor(d.count).toFixed(2)}`,
    ),
    `L ${xFor(n - 1).toFixed(2)},${baseY.toFixed(2)}`,
    "Z",
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label="Daily pageviews — last 28 days"
      className="block"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="text-brand-soft">
        <path d={areaPath} fill="url(#sparkFill)" />
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((d, i) => (
          <circle
            key={`${d.day}-${i}`}
            cx={xFor(i)}
            cy={yFor(d.count)}
            r={1.75}
            fill="currentColor"
          />
        ))}
      </g>
    </svg>
  );
}

// ─── Stat card primitive ──────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaClass,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  delta: string;
  deltaClass: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft">
          <Icon size={16} />
        </div>
        <span className={`text-[10px] uppercase tracking-widest font-mono ${deltaClass}`}>
          {delta}
        </span>
      </div>
      <div>
        <div className="text-3xl font-black text-white tracking-tight tabular-nums">
          {value}
        </div>
        <div className="mt-1 text-xs text-ink-muted uppercase tracking-widest">
          {label}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage() {
  const [
    visitors7d,
    visitorsPrior7d,
    streams7d,
    streamsPrior7d,
    trend28d,
    signups7d,
    signupsPrior7d,
    sources,
  ] = await Promise.all([
    fetchVisitors7d(),
    fetchVisitorsPrior7d(),
    fetchStreams7d(),
    fetchStreamsPrior7d(),
    fetchDailyTrend28d(),
    fetchSignupsLast(7),
    // prior 7d signups: count signups between 14 and 7 days ago
    (async () => {
      const start = daysAgo(14);
      const end = daysAgo(7);
      return prisma.betaRequest.count({
        where: { createdAt: { gte: start, lt: end } },
      });
    })(),
    fetchSources30d().catch(() => []),
  ]);

  // Build 28-day daily series, filling zero-days so the sparkline spans the full window.
  const fullSeries: Array<{ day: string; count: number }> = (() => {
    if (trend28d.length === 0) return [];
    const byDay = new Map<string, number>();
    for (const r of trend28d) {
      // queryTrend returns toString(toStartOfDay(timestamp)) — slice to date.
      const key = String(r.day).slice(0, 10);
      byDay.set(key, (byDay.get(key) ?? 0) + r.count);
    }
    const series: Array<{ day: string; count: number }> = [];
    const today = now();
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      series.push({ day: key, count: byDay.get(key) ?? 0 });
    }
    return series;
  })();

  const totalSignups = await prisma.betaRequest.count();

  // Conversion rate (7d): signups / visitors. Hide if either side is 0.
  const convRate =
    visitors7d != null && visitors7d > 0 && signups7d > 0
      ? (signups7d / visitors7d) * 100
      : null;
  const convRatePrior =
    visitorsPrior7d != null && visitorsPrior7d > 0 && signupsPrior7d > 0
      ? (signupsPrior7d / visitorsPrior7d) * 100
      : null;

  const posthogConfigured =
    visitors7d != null || streams7d != null || trend28d.length > 0;

  const sourceTotal = sources.reduce((acc, s) => acc + s.count, 0);
  const sourceMax = Math.max(1, ...sources.map((s) => s.count));

  return (
    <div className="text-white">
      {/* Sub-navigation */}
      <section className="px-6 pt-8 max-w-7xl mx-auto">
        <nav
          aria-label="Analytics sub-navigation"
          className="flex flex-wrap items-center gap-1 border-b border-white/8 pb-3"
        >
          {SUB_NAV.map((item) => {
            const active = item.href === "/admin/analytics";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                  active
                    ? "bg-brand/10 border border-brand/30 text-brand-soft"
                    : "text-ink-muted hover:text-white hover:bg-white/5 border border-transparent",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>

      {/* Header */}
      <section className="px-6 pt-10 pb-8 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
          Admin · Analytics
        </p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-4"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Analytics overview
        </h1>
        <p className="text-ink-muted max-w-2xl leading-relaxed">
          Top-line traffic, signup conversion, and acquisition mix. Numbers
          refresh every 60s — PostHog series are cached; the Prisma counts are
          live.
        </p>
      </section>

      {/* Stat cards */}
      <section className="px-6 pb-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Visitors · 7d"
            value={formatBigNumber(visitors7d)}
            delta={formatDelta(visitors7d, visitorsPrior7d)}
            deltaClass={deltaTone(visitors7d, visitorsPrior7d)}
          />
          <StatCard
            icon={UserPlus}
            label="Beta signups · 7d"
            value={formatBigNumber(signups7d)}
            delta={formatDelta(signups7d, signupsPrior7d)}
            deltaClass={deltaTone(signups7d, signupsPrior7d)}
          />
          <StatCard
            icon={Percent}
            label="Conversion · 7d"
            value={convRate == null ? "—" : `${convRate.toFixed(1)}%`}
            delta={
              convRate == null || convRatePrior == null
                ? "—"
                : formatDelta(convRate, convRatePrior)
            }
            deltaClass={deltaTone(convRate, convRatePrior)}
          />
          <StatCard
            icon={Radio}
            label="Streams started · 7d"
            value={formatBigNumber(streams7d)}
            delta={formatDelta(streams7d, streamsPrior7d)}
            deltaClass={deltaTone(streams7d, streamsPrior7d)}
          />
        </div>
      </section>

      {/* Chart panels */}
      <section className="px-6 pb-24 max-w-7xl mx-auto grid grid-cols-1 gap-6">
        {/* A — Daily traffic */}
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                <TrendingUp size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Daily traffic
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Pageviews per day · last 28 days · all paths
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
              28d
            </span>
          </div>

          <div className="p-6">
            {fullSeries.length === 0 ? (
              <div className="aspect-[5/1] min-h-[120px] bg-black/20 rounded-lg flex items-center justify-center p-6">
                <p className="text-xs text-ink-muted text-center max-w-md leading-relaxed">
                  PostHog query API not configured. Set{" "}
                  <code className="text-brand-soft font-mono">
                    POSTHOG_PROJECT_ID
                  </code>{" "}
                  and{" "}
                  <code className="text-brand-soft font-mono">
                    POSTHOG_PERSONAL_API_KEY
                  </code>{" "}
                  env vars to enable charts.
                </p>
              </div>
            ) : (
              <>
                <Sparkline data={fullSeries} />
                <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-faint font-mono">
                  <span>{fullSeries[0]?.day ?? ""}</span>
                  <span>
                    peak ·{" "}
                    {Math.max(...fullSeries.map((d) => d.count)).toLocaleString(
                      "en-US",
                    )}
                  </span>
                  <span>{fullSeries[fullSeries.length - 1]?.day ?? ""}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* B — Top traffic sources */}
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                <Compass size={16} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">
                  Top traffic sources
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Beta signups by{" "}
                  <code className="text-brand-soft font-mono">utm_source</code>{" "}
                  · last 30 days
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
              30d
            </span>
          </div>

          <div className="p-6">
            {totalSignups === 0 ? (
              <div className="rounded-lg bg-black/20 p-6">
                <p className="text-sm text-ink-muted text-center leading-relaxed">
                  No signups yet — share the marketing site to start collecting
                  leads.
                </p>
              </div>
            ) : sources.length === 0 ? (
              <p className="text-sm text-ink-muted text-center py-4">
                No signups in the last 30 days.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {sources.map((s) => {
                  const label = s.utmSource ?? "(direct)";
                  const widthPct = (s.count / sourceMax) * 100;
                  const sharePct =
                    sourceTotal === 0
                      ? 0
                      : (s.count / sourceTotal) * 100;
                  return (
                    <li key={label} className="flex flex-col gap-1.5">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-medium text-white font-mono truncate">
                          {label}
                        </span>
                        <span className="text-xs text-ink-muted font-mono shrink-0">
                          {s.count} · {sharePct.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-brand-soft/70 rounded-full"
                          style={{ width: `${widthPct}%` }}
                          aria-hidden
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {!posthogConfigured && (
          <p className="text-[10px] uppercase tracking-widest text-ink-faint font-mono text-center">
            <Activity className="inline-block mr-1" size={10} />
            PostHog query helpers returned empty — check server env vars.
          </p>
        )}
      </section>
    </div>
  );
}
