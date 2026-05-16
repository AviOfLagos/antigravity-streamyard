import Link from "next/link";
import {
  ShieldAlert,
  Activity,
  Users,
  Crosshair,
  Clock,
  TrendingUp,
  ListFilter,
  Table as TableIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// ─── Sub-navigation ───────────────────────────────────────────────────────
const SUB_NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/abuse", label: "Abuse" },
  { href: "/admin/posthog", label: "PostHog" },
] as const;

const ACTIVE_PATH = "/admin/abuse";

// ─── Time range ───────────────────────────────────────────────────────────
type RangeKey = "1h" | "24h" | "7d" | "30d";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "1h", label: "1h" },
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function parseRange(value: string | string[] | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "1h" || v === "24h" || v === "7d" || v === "30d") return v;
  return "24h";
}

function rangeStart(range: RangeKey): Date {
  const now = Date.now();
  switch (range) {
    case "1h":
      return new Date(now - HOUR_MS);
    case "24h":
      return new Date(now - 24 * HOUR_MS);
    case "7d":
      return new Date(now - 7 * DAY_MS);
    case "30d":
      return new Date(now - 30 * DAY_MS);
  }
}

// For ranges <= 24h we bucket by hour, otherwise by day.
function rangeBucketUnit(range: RangeKey): "hour" | "day" {
  return range === "1h" || range === "24h" ? "hour" : "day";
}

function rangeBucketCount(range: RangeKey): number {
  switch (range) {
    case "1h":
      return 12; // 5-min granularity rolled up to hour bars looks empty; use 12 hour buckets ending now for visual continuity instead
    case "24h":
      return 24;
    case "7d":
      return 7;
    case "30d":
      return 30;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function truncate(s: string | null | undefined, max: number): string {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function relativeTime(from: Date | null | undefined): string {
  if (!from) return "—";
  const diffMs = Date.now() - from.getTime();
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60)
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;
  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function formatBigNumber(n: number): string {
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString("en-US");
}

// ─── Data fetchers (each guarded so a single failure doesn't break the page)

async function fetchTotal(gte: Date): Promise<number> {
  try {
    return await prisma.rateLimitHit.count({ where: { createdAt: { gte } } });
  } catch (err) {
    console.warn(
      `[admin/abuse] total count query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return 0;
  }
}

async function fetchUniqueOffenders(gte: Date): Promise<number> {
  try {
    const rows = await prisma.rateLimitHit.findMany({
      where: { createdAt: { gte } },
      distinct: ["identifier"],
      select: { identifier: true },
    });
    return rows.length;
  } catch (err) {
    console.warn(
      `[admin/abuse] unique offenders query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return 0;
  }
}

async function fetchUniqueLimiters(gte: Date): Promise<number> {
  try {
    const rows = await prisma.rateLimitHit.findMany({
      where: { createdAt: { gte } },
      distinct: ["limiterType"],
      select: { limiterType: true },
    });
    return rows.length;
  } catch (err) {
    console.warn(
      `[admin/abuse] unique limiters query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return 0;
  }
}

async function fetchLastHit(): Promise<Date | null> {
  try {
    const row = await prisma.rateLimitHit.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return row?.createdAt ?? null;
  } catch (err) {
    console.warn(
      `[admin/abuse] last hit query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return null;
  }
}

type GroupRow = { key: string; count: number };

async function fetchTopOffenders(gte: Date): Promise<GroupRow[]> {
  try {
    const rows = await prisma.rateLimitHit.groupBy({
      by: ["identifier"],
      where: { createdAt: { gte } },
      _count: { _all: true },
      orderBy: { _count: { identifier: "desc" } },
      take: 20,
    });
    return rows.map((r) => ({ key: r.identifier, count: r._count._all }));
  } catch (err) {
    console.warn(
      `[admin/abuse] top offenders query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}

async function fetchTopLimiters(gte: Date): Promise<GroupRow[]> {
  try {
    const rows = await prisma.rateLimitHit.groupBy({
      by: ["limiterType"],
      where: { createdAt: { gte } },
      _count: { _all: true },
      orderBy: { _count: { limiterType: "desc" } },
      take: 20,
    });
    return rows.map((r) => ({ key: r.limiterType, count: r._count._all }));
  } catch (err) {
    console.warn(
      `[admin/abuse] top limiters query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}

type RecentHit = {
  id: string;
  createdAt: Date;
  identifier: string;
  limiterType: string;
  route: string | null;
  method: string | null;
  userAgent: string | null;
  country: string | null;
};

async function fetchRecentHits(gte: Date): Promise<RecentHit[]> {
  try {
    return await prisma.rateLimitHit.findMany({
      where: { createdAt: { gte } },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        identifier: true,
        limiterType: true,
        route: true,
        method: true,
        userAgent: true,
        country: true,
      },
    });
  } catch (err) {
    console.warn(
      `[admin/abuse] recent hits query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}

type BucketRow = { bucket: Date; count: number };

async function fetchSpike(range: RangeKey, gte: Date): Promise<BucketRow[]> {
  const unit = rangeBucketUnit(range);
  try {
    // date_trunc unit must be a literal — switch on unit rather than interpolate.
    const rows =
      unit === "hour"
        ? await prisma.$queryRaw<
            { bucket: Date; count: bigint }[]
          >`SELECT date_trunc('hour', "createdAt") AS bucket, COUNT(*)::bigint AS count
            FROM "RateLimitHit"
            WHERE "createdAt" >= ${gte}
            GROUP BY bucket
            ORDER BY bucket ASC`
        : await prisma.$queryRaw<
            { bucket: Date; count: bigint }[]
          >`SELECT date_trunc('day', "createdAt") AS bucket, COUNT(*)::bigint AS count
            FROM "RateLimitHit"
            WHERE "createdAt" >= ${gte}
            GROUP BY bucket
            ORDER BY bucket ASC`;
    return rows.map((r) => ({
      bucket: new Date(r.bucket),
      count: Number(r.count),
    }));
  } catch (err) {
    console.warn(
      `[admin/abuse] spike chart query failed: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return [];
  }
}

// Zero-fill buckets across the selected range so the timeline isn't gappy.
function fillBuckets(
  raw: BucketRow[],
  range: RangeKey,
  gte: Date,
): BucketRow[] {
  const unit = rangeBucketUnit(range);
  const count = rangeBucketCount(range);
  const stepMs = unit === "hour" ? HOUR_MS : DAY_MS;

  // Anchor first bucket to the start of the unit at/just before gte.
  const anchor = new Date(gte);
  if (unit === "hour") {
    anchor.setUTCMinutes(0, 0, 0);
  } else {
    anchor.setUTCHours(0, 0, 0, 0);
  }

  const byKey = new Map<number, number>();
  for (const r of raw) {
    byKey.set(r.bucket.getTime(), r.count);
  }

  // Build forward count buckets starting from anchor.
  // For 24h range we want exactly 24 hour buckets ending at the current hour;
  // for 7d/30d we want N day buckets ending today. We'll instead compute
  // buckets ending at the current period, walking backwards.
  const series: BucketRow[] = [];
  const nowAnchor = new Date();
  if (unit === "hour") nowAnchor.setUTCMinutes(0, 0, 0);
  else nowAnchor.setUTCHours(0, 0, 0, 0);

  for (let i = count - 1; i >= 0; i--) {
    const t = nowAnchor.getTime() - i * stepMs;
    if (t < anchor.getTime() - stepMs) continue;
    series.push({ bucket: new Date(t), count: byKey.get(t) ?? 0 });
  }
  return series;
}

// ─── UI primitives ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft">
          <Icon size={16} />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-mono text-ink-faint">
          {sub}
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

function BarList({
  rows,
  emptyHint,
  monoLabel = false,
  truncateAt = 40,
}: {
  rows: GroupRow[];
  emptyHint: string;
  monoLabel?: boolean;
  truncateAt?: number;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-muted text-center py-6">{emptyHint}</p>
    );
  }
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((r) => {
        const widthPct = (r.count / max) * 100;
        return (
          <li key={r.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span
                title={r.key}
                className={[
                  "text-sm font-medium text-white truncate",
                  monoLabel ? "font-mono" : "",
                ].join(" ")}
              >
                {truncate(r.key, truncateAt)}
              </span>
              <span className="text-xs text-ink-muted font-mono shrink-0 tabular-nums">
                {r.count.toLocaleString("en-US")}
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
  );
}

function SpikeChart({
  series,
  unit,
}: {
  series: BucketRow[];
  unit: "hour" | "day";
}) {
  if (series.length === 0) {
    return (
      <div className="h-[80px] rounded-lg bg-black/20 flex items-center justify-center">
        <p className="text-xs text-ink-muted">No data in range.</p>
      </div>
    );
  }
  const width = 800;
  const height = 80;
  const padX = 8;
  const padY = 8;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const n = series.length;
  const max = Math.max(1, ...series.map((b) => b.count));

  const barGap = 2;
  const barW = Math.max(1, innerW / n - barGap);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        width="100%"
        height={height}
        role="img"
        aria-label={`Hits per ${unit} across selected range`}
        className="block text-brand-soft"
      >
        {series.map((b, i) => {
          const x = padX + (i * innerW) / n;
          const h = (b.count / max) * innerH;
          const y = padY + innerH - h;
          return (
            <rect
              key={b.bucket.getTime()}
              x={x.toFixed(2)}
              y={y.toFixed(2)}
              width={barW.toFixed(2)}
              height={Math.max(1, h).toFixed(2)}
              rx="1"
              fill="currentColor"
              fillOpacity={b.count === 0 ? 0.12 : 0.85}
            />
          );
        })}
      </svg>
      <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-ink-faint font-mono">
        <span>
          {series[0]?.bucket.toISOString().slice(0, unit === "hour" ? 13 : 10)}
          {unit === "hour" ? ":00Z" : ""}
        </span>
        <span>peak · {max.toLocaleString("en-US")}</span>
        <span>
          {series[series.length - 1]?.bucket
            .toISOString()
            .slice(0, unit === "hour" ? 13 : 10)}
          {unit === "hour" ? ":00Z" : ""}
        </span>
      </div>
    </div>
  );
}

function RangePills({ active }: { active: RangeKey }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-surface-1/40 p-1">
      {RANGES.map((r) => {
        const isActive = r.key === active;
        return (
          <Link
            key={r.key}
            href={`/admin/abuse?range=${r.key}`}
            className={
              isActive
                ? "px-3 py-1 rounded-md text-xs font-mono font-semibold bg-brand/20 border border-brand/30 text-white"
                : "px-3 py-1 rounded-md text-xs font-mono font-semibold text-ink-muted hover:text-white hover:bg-white/5 transition-colors"
            }
          >
            {r.label}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function AdminAbusePage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string | string[] }>;
}) {
  const params = (await searchParams) ?? {};
  const range = parseRange(params.range);
  const gte = rangeStart(range);

  const [
    total,
    uniqueOffenders,
    uniqueLimiters,
    lastHit,
    topOffenders,
    topLimiters,
    recentHits,
    spikeRaw,
  ] = await Promise.all([
    fetchTotal(gte),
    fetchUniqueOffenders(gte),
    fetchUniqueLimiters(gte),
    fetchLastHit(),
    fetchTopOffenders(gte),
    fetchTopLimiters(gte),
    fetchRecentHits(gte),
    fetchSpike(range, gte),
  ]);

  const spikeSeries = fillBuckets(spikeRaw, range, gte);
  const spikeUnit = rangeBucketUnit(range);

  return (
    <div className="text-white">
      {/* Sub-navigation */}
      <section className="px-6 pt-8 max-w-7xl mx-auto">
        <nav
          aria-label="Admin analytics sub-navigation"
          className="flex flex-wrap items-center gap-1 h-11 border-b border-white/8 pb-3"
        >
          {SUB_NAV.map((item) => {
            const active = item.href === ACTIVE_PATH;
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
          Admin · Abuse
        </p>
        <div className="flex items-start justify-between gap-6 flex-wrap mb-4">
          <h1
            className="font-black text-white tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
          >
            Abuse monitor
          </h1>
          <RangePills active={range} />
        </div>
        <p className="text-ink-muted max-w-2xl leading-relaxed">
          Rate-limit hits in the selected window — who got throttled, where, and
          how often. Anything spiking unexpectedly is worth a closer look at the
          limiter config or the originating identifier.
        </p>
      </section>

      {/* Empty state */}
      {total === 0 ? (
        <section className="px-6 pb-24 max-w-7xl mx-auto">
          <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-10 text-center">
            <p className="text-sm text-ink-muted leading-relaxed">
              No rate-limit hits in the selected range. Either you have very
              polite users or the limiters are too generous.
            </p>
          </div>
        </section>
      ) : (
        <>
          {/* Stat cards */}
          <section className="px-6 pb-8 max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={ShieldAlert}
                label={`Total hits · ${range}`}
                value={formatBigNumber(total)}
                sub={range}
              />
              <StatCard
                icon={Users}
                label="Unique offenders"
                value={formatBigNumber(uniqueOffenders)}
                sub="distinct id"
              />
              <StatCard
                icon={Crosshair}
                label="Endpoints hit"
                value={formatBigNumber(uniqueLimiters)}
                sub="limiter types"
              />
              <StatCard
                icon={Clock}
                label="Last hit"
                value={relativeTime(lastHit)}
                sub={lastHit ? lastHit.toISOString().slice(11, 19) + "Z" : "—"}
              />
            </div>
          </section>

          {/* Spike chart */}
          <section className="px-6 pb-10 max-w-7xl mx-auto">
            <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                    <TrendingUp size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Traffic spikes
                    </h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Hits per {spikeUnit} · zero-filled across the {range}{" "}
                      window
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                  {range}
                </span>
              </div>
              <div className="p-6">
                <SpikeChart series={spikeSeries} unit={spikeUnit} />
              </div>
            </div>
          </section>

          {/* Panel A + B */}
          <section className="px-6 pb-10 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                    <Users size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Top offending identifiers
                    </h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Most-throttled IPs / user ids · top 20
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                  {range}
                </span>
              </div>
              <div className="p-6">
                <BarList
                  rows={topOffenders}
                  emptyHint="No offenders in range."
                  monoLabel
                  truncateAt={40}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                    <ListFilter size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Hottest limiter types
                    </h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Which endpoints get throttled most · top 20
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                  {range}
                </span>
              </div>
              <div className="p-6">
                <BarList
                  rows={topLimiters}
                  emptyHint="No limiter hits in range."
                  monoLabel
                  truncateAt={40}
                />
              </div>
            </div>
          </section>

          {/* Panel C — Recent hits table */}
          <section className="px-6 pb-24 max-w-7xl mx-auto">
            <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
                    <TableIcon size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">
                      Recent hits
                    </h2>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Last 50 rate-limit hits in the selected window
                    </p>
                  </div>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                  {recentHits.length} rows
                </span>
              </div>
              <div className="overflow-x-auto">
                {recentHits.length === 0 ? (
                  <p className="text-sm text-ink-muted text-center py-8">
                    No hits in range.
                  </p>
                ) : (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-widest text-ink-faint font-mono border-b border-white/5">
                        <th className="px-5 py-3 font-semibold">When</th>
                        <th className="px-3 py-3 font-semibold">Identifier</th>
                        <th className="px-3 py-3 font-semibold">Limiter</th>
                        <th className="px-3 py-3 font-semibold">Route</th>
                        <th className="px-3 py-3 font-semibold">Method</th>
                        <th className="px-3 py-3 font-semibold">Country</th>
                        <th className="px-5 py-3 font-semibold">UA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentHits.map((h) => (
                        <tr
                          key={h.id}
                          className="border-b border-white/5 hover:bg-white/5 transition-colors"
                        >
                          <td
                            className="px-5 py-3 text-ink-muted whitespace-nowrap"
                            title={h.createdAt.toISOString()}
                          >
                            {relativeTime(h.createdAt)}
                          </td>
                          <td
                            className="px-3 py-3 whitespace-nowrap"
                            title={h.identifier}
                          >
                            <code className="text-[11px] text-white">
                              {truncate(h.identifier, 32)}
                            </code>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <code className="text-[11px] text-brand-soft">
                              {h.limiterType}
                            </code>
                          </td>
                          <td
                            className="px-3 py-3 text-ink-muted"
                            title={h.route ?? undefined}
                          >
                            <code className="text-[11px]">
                              {truncate(h.route, 40) || "—"}
                            </code>
                          </td>
                          <td className="px-3 py-3 text-ink-muted font-mono">
                            {h.method ?? "—"}
                          </td>
                          <td className="px-3 py-3 text-ink-muted font-mono">
                            {h.country ?? "—"}
                          </td>
                          <td
                            className="px-5 py-3 text-ink-faint max-w-[280px]"
                            title={h.userAgent ?? undefined}
                          >
                            <code className="text-[10px]">
                              {truncate(h.userAgent, 60) || "—"}
                            </code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Footer note */}
      <section className="px-6 pb-16 max-w-7xl mx-auto">
        <p className="text-[10px] uppercase tracking-widest text-ink-faint font-mono text-center">
          <Activity className="inline-block mr-1" size={10} />
          DB-sourced · table: RateLimitHit · range: {range}
        </p>
      </section>
    </div>
  );
}
