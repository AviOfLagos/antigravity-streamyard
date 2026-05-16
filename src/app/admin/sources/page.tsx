import Link from "next/link";
import {
  BarChart2,
  GitBranch,
  Compass,
  ExternalLink,
  Globe2,
  Link2,
  Megaphone,
  Inbox,
  Info,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RangeKey = "7d" | "28d" | "90d" | "all";

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: "7d", label: "Last 7 days" },
  { key: "28d", label: "Last 28 days" },
  { key: "90d", label: "Last 90 days" },
  { key: "all", label: "All time" },
];

const RANGE_DAYS: Record<Exclude<RangeKey, "all">, number> = {
  "7d": 7,
  "28d": 28,
  "90d": 90,
};

const SUB_NAV: Array<{ href: string; label: string; icon: typeof BarChart2 }> = [
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/funnel", label: "Funnel", icon: GitBranch },
  { href: "/admin/sources", label: "Sources", icon: Compass },
  { href: "/admin/posthog", label: "PostHog", icon: ExternalLink },
];

const ACTIVE_PATH = "/admin/sources";

function parseRange(value: string | string[] | undefined): RangeKey {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "7d" || v === "28d" || v === "90d" || v === "all") return v;
  return "28d";
}

function rangeStart(range: RangeKey): Date | null {
  if (range === "all") return null;
  const days = RANGE_DAYS[range];
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function rangeLabel(range: RangeKey): string {
  return RANGES.find((r) => r.key === range)?.label ?? "Last 28 days";
}

function hostnameFrom(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 50);
  }
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export default async function SourcesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  // Auth handled by /admin/layout.tsx via requireAdmin().
  const params = await searchParams;
  const range = parseRange(params.range);
  const start = rangeStart(range);

  const where = start ? { createdAt: { gte: start } } : {};

  const [
    total,
    withAttribution,
    utmSourceGroups,
    utmCampaignGroups,
    referrerGroups,
    countryGroups,
    recent,
  ] = await Promise.all([
    prisma.betaRequest.count({ where }),
    prisma.betaRequest.count({
      where: {
        ...where,
        OR: [
          { utmSource: { not: null } },
          { utmCampaign: { not: null } },
          { utmMedium: { not: null } },
          { referrer: { not: null } },
        ],
      },
    }),
    prisma.betaRequest.groupBy({
      by: ["utmSource"],
      where,
      _count: { _all: true },
      orderBy: { _count: { utmSource: "desc" } },
      take: 10,
    }),
    prisma.betaRequest.groupBy({
      by: ["utmCampaign"],
      where,
      _count: { _all: true },
      orderBy: { _count: { utmCampaign: "desc" } },
      take: 10,
    }),
    prisma.betaRequest.groupBy({
      by: ["referrer"],
      where,
      _count: { _all: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
    prisma.betaRequest.groupBy({
      by: ["country"],
      where,
      _count: { _all: true },
      orderBy: { _count: { country: "desc" } },
      take: 15,
    }),
    prisma.betaRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        email: true,
        platform: true,
        utmSource: true,
        utmCampaign: true,
        country: true,
        referrer: true,
      },
    }),
  ]);

  const directUnknown = Math.max(total - withAttribution, 0);

  return (
    <div className="text-white">
      {/* Sub-navigation strip */}
      <div className="border-b border-white/8 bg-surface-1/30">
        <div className="max-w-7xl mx-auto px-6 h-11 flex items-center gap-1 overflow-x-auto">
          {SUB_NAV.map((n) => {
            const Icon = n.icon;
            const active = n.href === ACTIVE_PATH;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  active
                    ? "bg-brand/10 border border-brand/30 text-brand-soft"
                    : "text-ink-muted hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon size={13} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </div>

      <section className="px-6 pt-16 pb-6 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
          Admin · Sources
        </p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Where signups come from
        </h1>
        <p className="text-ink-muted max-w-2xl mb-8 leading-relaxed">
          UTM, referrer, and geographic attribution captured at beta-signup time.
          First/last-touch values are stored alongside the{" "}
          <code className="text-brand-soft font-mono text-sm">BetaRequest</code>{" "}
          row — no IP addresses, no client-side persistence beyond the visitor&apos;s
          own URL.
        </p>

        {/* Time range selector */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-[10px] uppercase tracking-widest text-ink-faint font-bold mr-1">
            Range
          </span>
          {RANGES.map((r) => {
            const active = r.key === range;
            return (
              <Link
                key={r.key}
                href={`/admin/sources?range=${r.key}`}
                className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border ${
                  active
                    ? "bg-brand/10 border-brand/30 text-brand-soft"
                    : "border-white/8 text-ink-muted hover:text-white hover:bg-white/5"
                }`}
              >
                {r.label}
              </Link>
            );
          })}
        </div>

        {/* Total stat row */}
        <p className="text-sm text-ink-muted font-mono">
          <span className="text-white font-bold">{total}</span> signup
          {total === 1 ? "" : "s"} in{" "}
          <span className="text-white">{rangeLabel(range).toLowerCase()}</span> ·{" "}
          <span className="text-white font-bold">{withAttribution}</span> with
          attribution data ·{" "}
          <span className="text-white font-bold">{directUnknown}</span>{" "}
          direct/unknown
        </p>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        {total === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-10 flex items-start gap-4 mt-6">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center text-ink-muted shrink-0">
              <Inbox size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1.5">
                No signups yet
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed max-w-lg">
                Once visitors submit the beta form, their UTM tags, referrer, and
                approximate geography will be aggregated here. Try a different
                range, or check back after the next campaign push.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Row 1: Panels A + B */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <BarPanel
                icon={<Megaphone size={16} />}
                title="Top UTM sources"
                subtitle="utm_source · top 10"
                rows={utmSourceGroups.map((g) => ({
                  key: g.utmSource ?? "__null__",
                  label: g.utmSource ?? "Direct / Unknown",
                  count: g._count._all,
                }))}
                total={total}
                emptyLabel="No utm_source values captured."
              />
              <BarPanel
                icon={<Megaphone size={16} />}
                title="Top UTM campaigns"
                subtitle="utm_campaign · top 10"
                rows={utmCampaignGroups.map((g) => ({
                  key: g.utmCampaign ?? "__null__",
                  label: g.utmCampaign ?? "Direct / Unknown",
                  count: g._count._all,
                }))}
                total={total}
                emptyLabel="No utm_campaign values captured."
              />
            </div>

            {/* Row 2: Panels C + D */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <BarPanel
                icon={<Link2 size={16} />}
                title="Top referrers"
                subtitle="referrer hostname · top 10"
                rows={referrerGroups.map((g) => ({
                  key: g.referrer ?? "__null__",
                  label: hostnameFrom(g.referrer) ?? "Direct / Unknown",
                  fullValue: g.referrer ?? undefined,
                  count: g._count._all,
                }))}
                total={total}
                emptyLabel="No referrer values captured."
              />
              <CountryPanel
                rows={countryGroups.map((g) => ({
                  country: g.country,
                  count: g._count._all,
                }))}
                total={total}
              />
            </div>

            {/* Row 3: Panel E full-width */}
            <div className="mt-6">
              <RecentSignupsPanel rows={recent} />
            </div>
          </>
        )}

        {/* Privacy note */}
        <div className="mt-12 pt-8 border-t border-white/5 flex items-start gap-3">
          <Info size={14} className="text-ink-faint shrink-0 mt-0.5" />
          <p className="text-[11px] text-ink-faint leading-relaxed max-w-3xl">
            Geographic data approximated from Vercel edge headers at signup time.
            Stored only at the country/region/city level; no IP addresses
            persisted. UTM and referrer data captured from the visitor&apos;s
            browser per first/last-touch attribution model. See{" "}
            <code className="text-ink-muted font-mono">
              /doc/analytics/event-taxonomy.md
            </code>{" "}
            §8 for full PII handling.
          </p>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Panels                                                              */
/* ------------------------------------------------------------------ */

type BarRow = {
  key: string;
  label: string;
  fullValue?: string;
  count: number;
};

function BarPanel({
  icon,
  title,
  subtitle,
  rows,
  total,
  emptyLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  rows: BarRow[];
  total: number;
  emptyLabel: string;
}) {
  const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-0.5">{title}</h3>
            <p className="text-[11px] text-ink-faint font-mono">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-faint py-4">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => {
              const widthPct = max > 0 ? Math.max((r.count / max) * 100, 2) : 0;
              const sharePct = pct(r.count, total);
              const isNullish = r.key === "__null__";
              return (
                <li key={r.key} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1.5">
                      <span
                        className={`text-xs font-medium truncate ${
                          isNullish ? "text-ink-faint italic" : "text-white"
                        }`}
                        title={r.fullValue ?? r.label}
                      >
                        {r.label}
                      </span>
                      <span className="text-[11px] font-mono text-ink-muted shrink-0">
                        {r.count}{" "}
                        <span className="text-ink-faint">
                          · {sharePct.toFixed(1)}%
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isNullish ? "bg-white/8" : "bg-brand/70"
                        }`}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function CountryPanel({
  rows,
  total,
}: {
  rows: Array<{ country: string | null; count: number }>;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
            <Globe2 size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-0.5">
              Geographic breakdown
            </h3>
            <p className="text-[11px] text-ink-faint font-mono">
              country · top 15
            </p>
          </div>
        </div>
      </div>
      <div className="px-5 py-2">
        {rows.length === 0 ? (
          <p className="text-sm text-ink-faint py-4">
            No country values captured.
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                <th className="text-left py-2 pr-3">Country</th>
                <th className="text-right py-2 pr-3">Count</th>
                <th className="text-right py-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isNullish = !r.country;
                return (
                  <tr
                    key={r.country ?? `__null__${i}`}
                    className="border-t border-white/5"
                  >
                    <td className="py-2 pr-3 text-xs">
                      <span
                        className={
                          isNullish
                            ? "text-ink-faint italic"
                            : "text-white font-mono"
                        }
                      >
                        {r.country ?? "Unknown"}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-xs text-ink-muted font-mono text-right">
                      {r.count}
                    </td>
                    <td className="py-2 text-xs text-ink-faint font-mono text-right">
                      {pct(r.count, total).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

type RecentRow = {
  id: string;
  createdAt: Date;
  email: string;
  platform: string;
  utmSource: string | null;
  utmCampaign: string | null;
  country: string | null;
  referrer: string | null;
};

function RecentSignupsPanel({ rows }: { rows: RecentRow[] }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
            <Inbox size={16} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-0.5">
              Recent signups
            </h3>
            <p className="text-[11px] text-ink-faint font-mono">
              ordered by createdAt desc · last 20
            </p>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse">
          <thead>
            <tr className="text-[10px] font-bold uppercase tracking-widest text-ink-faint border-b border-white/5">
              <th className="text-left px-5 py-3 whitespace-nowrap">When</th>
              <th className="text-left px-3 py-3">Email</th>
              <th className="text-left px-3 py-3">Platform</th>
              <th className="text-left px-3 py-3">UTM source</th>
              <th className="text-left px-3 py-3">UTM campaign</th>
              <th className="text-left px-3 py-3">Country</th>
              <th className="text-left px-5 py-3">Referrer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const refHost = hostnameFrom(r.referrer);
              return (
                <tr
                  key={r.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3 text-xs text-ink-muted font-mono whitespace-nowrap">
                    {r.createdAt.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <a
                      href={`mailto:${r.email}`}
                      className="text-brand-soft hover:text-white underline underline-offset-2"
                    >
                      {r.email}
                    </a>
                  </td>
                  <td className="px-3 py-3 text-xs text-white">{r.platform}</td>
                  <td className="px-3 py-3 text-xs">
                    {r.utmSource ? (
                      <span className="text-white font-mono">{r.utmSource}</span>
                    ) : (
                      <span className="text-ink-faint italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {r.utmCampaign ? (
                      <span className="text-white font-mono">
                        {r.utmCampaign}
                      </span>
                    ) : (
                      <span className="text-ink-faint italic">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs">
                    {r.country ? (
                      <span className="text-white font-mono">{r.country}</span>
                    ) : (
                      <span className="text-ink-faint italic">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {refHost ? (
                      <span
                        className="text-ink-muted font-mono"
                        title={r.referrer ?? undefined}
                      >
                        {refHost}
                      </span>
                    ) : (
                      <span className="text-ink-faint italic">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
