import Link from "next/link";

import { queryFunnel } from "@/lib/posthog-query";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

// ─── Helpers ──────────────────────────────────────────────────────────────

function rangeToDateFrom(range: string): string {
  const days = range === "7d" ? 7 : range === "90d" ? 90 : 28;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

function normalizeRange(raw: string | string[] | undefined): "7d" | "28d" | "90d" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "7d" || v === "90d" ? v : "28d";
}

function formatPct(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "0%";
  if (ratio >= 1) return "100%";
  if (ratio < 0.001) return "<0.1%";
  return `${(ratio * 100).toFixed(ratio < 0.1 ? 2 : 1)}%`;
}

function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

// ─── Funnel step definitions (hardcoded — never user input) ───────────────
// Mirrors doc/analytics/event-taxonomy.md §7.

const MARKETING_FUNNEL_STEPS: { event: string; properties?: Record<string, unknown> }[] = [
  { event: "$pageview" },
  { event: "beta_modal_opened" },
  { event: "beta_modal_submitted" },
  { event: "beta_modal_success" },
];

const MARKETING_CONVERSION_WINDOW_MIN = 30;

const ACTIVATION_FUNNEL_STEPS: { event: string; properties?: Record<string, unknown> }[] = [
  { event: "login_succeeded", properties: { is_new_user: true } },
  { event: "dashboard_first_view" },
  { event: "studio_created" },
  { event: "stream_started" },
  { event: "first_stream_completed_30s" },
];

const ACTIVATION_CONVERSION_WINDOW_DAYS = 7;

// ─── Step labels (display only) ───────────────────────────────────────────

const STEP_LABELS: Record<string, string> = {
  $pageview: "Visitor (marketing pageview)",
  beta_modal_opened: "Opened beta modal",
  beta_modal_submitted: "Submitted beta form",
  beta_modal_success: "Beta signup success",
  login_succeeded: "Signed in (new user)",
  dashboard_first_view: "First dashboard view",
  studio_created: "Created studio",
  stream_started: "Started stream",
  first_stream_completed_30s: "Completed 30s of stream",
};

// ─── Render primitives ────────────────────────────────────────────────────

type FunnelRow = { event: string; count: number; conversionRate: number };

const PLACEHOLDER_COPY =
  "Funnel data unavailable. Confirm POSTHOG_PROJECT_ID + POSTHOG_PERSONAL_API_KEY are set, and at least one event has fired for each step in the selected window.";

function FunnelPlaceholder() {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-6">
      <p className="text-sm text-ink-muted leading-relaxed">{PLACEHOLDER_COPY}</p>
    </div>
  );
}

function FunnelBars({ rows }: { rows: FunnelRow[] }) {
  const firstCount = rows[0]?.count ?? 0;

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row, i) => {
        const prev = i === 0 ? null : rows[i - 1];
        const prevCount = prev?.count ?? 0;
        const stepRate =
          i === 0
            ? 1
            : prevCount === 0
            ? 0
            : row.count / prevCount;
        const overallRate = firstCount === 0 ? 0 : row.count / firstCount;
        const widthPct = firstCount === 0 ? 0 : Math.max(0, Math.min(100, (row.count / firstCount) * 100));
        const dropPct = i === 0 ? 0 : Math.max(0, 100 - widthPct);
        const label = STEP_LABELS[row.event] ?? row.event;

        return (
          <li
            key={`${row.event}-${i}`}
            className="rounded-xl border border-white/8 bg-surface-1/40 p-4"
          >
            <div className="flex items-baseline justify-between gap-3 mb-2">
              <div className="flex items-baseline gap-3 min-w-0">
                <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                  Step {i + 1}
                </span>
                <span className="text-sm font-semibold text-white truncate">
                  {label}
                </span>
                <code className="text-[11px] text-ink-faint font-mono truncate hidden sm:inline">
                  {row.event}
                </code>
              </div>
              <span className="text-sm font-mono font-semibold text-brand-soft shrink-0">
                {formatCount(row.count)}
              </span>
            </div>

            <div className="relative h-3 w-full rounded-full overflow-hidden bg-white/[0.04] border border-white/5 flex">
              <div
                className="h-full bg-brand/40"
                style={{ width: `${widthPct}%` }}
                aria-hidden
              />
              {dropPct > 0 ? (
                <div
                  className="h-full bg-danger/20"
                  style={{ width: `${dropPct}%` }}
                  aria-hidden
                />
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-xs">
              {i === 0 ? (
                <span className="text-ink-faint font-mono">
                  baseline
                </span>
              ) : (
                <span className="text-ink-muted font-mono">
                  → {formatPct(stepRate)} from prev
                </span>
              )}
              <span className="text-ink-faint font-mono">
                {formatPct(overallRate)} from visitor
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function FunnelPanel({
  title,
  subtitle,
  windowLabel,
  rows,
}: {
  title: string;
  subtitle: string;
  windowLabel: string;
  rows: FunnelRow[];
}) {
  return (
    <section className="rounded-2xl border border-white/8 bg-surface-1/40 p-6">
      <header className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white mb-1.5 tracking-tight">
            {title}
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed">{subtitle}</p>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
          {windowLabel}
        </span>
      </header>

      {rows.length === 0 ? <FunnelPlaceholder /> : <FunnelBars rows={rows} />}
    </section>
  );
}

// ─── Sub-nav strip (inline; matches A3.8) ─────────────────────────────────

const SUBNAV: { href: string; label: string; key: string }[] = [
  { href: "/admin/analytics", label: "Analytics", key: "analytics" },
  { href: "/admin/funnel", label: "Funnel", key: "funnel" },
  { href: "/admin/sources", label: "Sources", key: "sources" },
  { href: "/admin/posthog", label: "PostHog", key: "posthog" },
];

function SubNav({ active }: { active: string }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 mb-10">
      {SUBNAV.map((n) => {
        const isActive = n.key === active;
        return (
          <Link
            key={n.href}
            href={n.href}
            className={
              isActive
                ? "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-brand/15 border border-brand/30 text-white"
                : "inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold text-ink-muted border border-transparent hover:text-white hover:bg-white/5 transition-colors"
            }
          >
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function RangePills({ active }: { active: "7d" | "28d" | "90d" }) {
  const opts: ("7d" | "28d" | "90d")[] = ["7d", "28d", "90d"];
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-surface-1/40 p-1">
      {opts.map((r) => {
        const isActive = r === active;
        return (
          <Link
            key={r}
            href={`/admin/funnel?range=${r}`}
            className={
              isActive
                ? "px-3 py-1 rounded-md text-xs font-mono font-semibold bg-brand/20 border border-brand/30 text-white"
                : "px-3 py-1 rounded-md text-xs font-mono font-semibold text-ink-muted hover:text-white hover:bg-white/5 transition-colors"
            }
          >
            {r}
          </Link>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default async function FunnelAdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string | string[] }>;
}) {
  // Auth handled by /admin/layout.tsx via requireAdmin().
  const params = (await searchParams) ?? {};
  const range = normalizeRange(params.range);
  const dateFrom = rangeToDateFrom(range);

  // Run both funnels in parallel; isolate failures so one bad query can't
  // poison the other panel.
  const [marketingResult, activationResult] = await Promise.all([
    queryFunnel(MARKETING_FUNNEL_STEPS, {
      dateFrom,
      conversionWindowDays: MARKETING_CONVERSION_WINDOW_MIN / (60 * 24),
    })
      .then((rows) => ({ ok: true as const, rows }))
      .catch((err) => {
        console.warn(
          `[admin/funnel] marketing funnel query failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return { ok: false as const, rows: [] as FunnelRow[] };
      }),
    queryFunnel(ACTIVATION_FUNNEL_STEPS, {
      dateFrom,
      conversionWindowDays: ACTIVATION_CONVERSION_WINDOW_DAYS,
    })
      .then((rows) => ({ ok: true as const, rows }))
      .catch((err) => {
        console.warn(
          `[admin/funnel] activation funnel query failed: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
        return { ok: false as const, rows: [] as FunnelRow[] };
      }),
  ]);

  return (
    <div className="text-white">
      <section className="px-6 pt-16 pb-8 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
          Admin · Analytics
        </p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          Funnels
        </h1>
        <p className="text-ink-muted max-w-2xl mb-10 leading-relaxed">
          Step-by-step conversion through the two core flows: marketing visitor
          to beta signup, and new-user activation through to a sustained stream.
        </p>

        <SubNav active="funnel" />

        <div className="flex items-center justify-between gap-4 mb-10">
          <span className="text-xs uppercase tracking-widest text-ink-faint font-mono">
            Window
          </span>
          <RangePills active={range} />
        </div>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto flex flex-col gap-8">
        <FunnelPanel
          title="Marketing → Beta"
          subtitle="Visitor → CTA → Submit → Success"
          windowLabel={`${range} · 30-min conv. window`}
          rows={marketingResult.rows}
        />

        <FunnelPanel
          title="Activation (new users)"
          subtitle="Sign-in → Dashboard → Studio → Stream → 30s sustained"
          windowLabel={`${range} · 7-day conv. window`}
          rows={activationResult.rows}
        />
      </section>
    </div>
  );
}
