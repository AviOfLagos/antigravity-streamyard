import Link from "next/link";
import { PartyPopper, Satellite, Siren, BarChart3 } from "lucide-react";

import { SlackTestButton } from "./SlackTestButton";

export const dynamic = "force-dynamic";

// ─── Sub-navigation ───────────────────────────────────────────────────────
const SUB_NAV = [
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/funnel", label: "Funnel" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/abuse", label: "Abuse" },
  { href: "/admin/slack", label: "Slack" },
  { href: "/admin/posthog", label: "PostHog" },
] as const;

const ACTIVE_PATH = "/admin/slack";

// ─── Channel definitions ──────────────────────────────────────────────────
type ChannelKey = "beta-signups" | "streams" | "alerts" | "digest";

type Channel = {
  key: ChannelKey;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
  envVar:
    | "SLACK_WEBHOOK_BETA_SIGNUPS"
    | "SLACK_WEBHOOK_STREAMS"
    | "SLACK_WEBHOOK_ALERTS"
    | "SLACK_WEBHOOK_DIGEST";
};

const CHANNELS: readonly Channel[] = [
  {
    key: "beta-signups",
    title: "Beta signups",
    icon: PartyPopper,
    description: "New beta requests from the marketing form.",
    envVar: "SLACK_WEBHOOK_BETA_SIGNUPS",
  },
  {
    key: "streams",
    title: "Streams",
    icon: Satellite,
    description: "Stream-started events from the LiveKit room manager.",
    envVar: "SLACK_WEBHOOK_STREAMS",
  },
  {
    key: "alerts",
    title: "Alerts",
    icon: Siren,
    description: "Server errors + rate-limit spikes (>20 hits / 5 min).",
    envVar: "SLACK_WEBHOOK_ALERTS",
  },
  {
    key: "digest",
    title: "Digest",
    icon: BarChart3,
    description: "Weekly digest of signups, streams, conversion. (future)",
    envVar: "SLACK_WEBHOOK_DIGEST",
  },
] as const;

// ─── Event-routing reference table ────────────────────────────────────────
const EVENT_ROUTES: ReadonlyArray<{
  event: string;
  channel: string;
  severity: "info" | "warn" | "error";
}> = [
  { event: "beta_signup_persisted", channel: "#beta-signups", severity: "info" },
  { event: "stream_started", channel: "#streams", severity: "info" },
  { event: "onRequestError (server)", channel: "#alerts", severity: "error" },
  { event: "RateLimitHit spike (>20/5min)", channel: "#alerts", severity: "warn" },
  { event: "Weekly digest (future)", channel: "#digest", severity: "info" },
] as const;

function severityClass(s: "info" | "warn" | "error"): string {
  switch (s) {
    case "error":
      return "text-red-300 bg-red-500/10 border-red-500/30";
    case "warn":
      return "text-amber-200 bg-amber-500/10 border-amber-500/30";
    default:
      return "text-brand-soft bg-brand/10 border-brand/30";
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function AdminSlackPage() {
  // Server-side env presence read. Booleans only — never leak the URLs.
  const configured: Record<ChannelKey, boolean> = {
    "beta-signups": !!process.env.SLACK_WEBHOOK_BETA_SIGNUPS,
    streams: !!process.env.SLACK_WEBHOOK_STREAMS,
    alerts: !!process.env.SLACK_WEBHOOK_ALERTS,
    digest: !!process.env.SLACK_WEBHOOK_DIGEST,
  };

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
          Slack Integration
        </p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-4"
          style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
        >
          Slack channels
        </h1>
        <p className="text-ink-muted max-w-2xl leading-relaxed">
          Realtime ops alerts to Slack via per-channel incoming webhooks. Fire
          test messages below to verify each channel is wired.
        </p>
      </section>

      {/* Channel status grid */}
      <section className="px-6 pb-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            const isConfigured = configured[c.key];
            return (
              <div
                key={c.key}
                className="rounded-2xl border border-white/8 bg-surface-1/40 p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft">
                    <Icon size={16} />
                  </div>
                  <span
                    className={[
                      "text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border",
                      isConfigured
                        ? "text-brand-soft bg-brand/10 border-brand/30"
                        : "text-ink-faint bg-white/5 border-white/8",
                    ].join(" ")}
                  >
                    {isConfigured ? "Configured" : "Not configured"}
                  </span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-white mb-1">
                    {c.title}
                  </h2>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {c.description}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <SlackTestButton
                    channel={c.key}
                    configured={isConfigured}
                  />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-ink-faint font-mono">
                  env · {c.envVar}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Event-routing reference */}
      <section className="px-6 pb-12 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5">
            <h2 className="text-base font-bold text-white">Event routing</h2>
            <p className="text-xs text-ink-muted leading-relaxed mt-1">
              Which application events fire into which Slack channel.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-widest text-ink-faint font-mono border-b border-white/5">
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Channel</th>
                  <th className="px-5 py-3 font-semibold">Severity</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_ROUTES.map((row) => (
                  <tr
                    key={row.event}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-white">
                      {row.event}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted">
                      {row.channel}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={[
                          "inline-block text-[10px] uppercase tracking-widest font-mono px-2 py-0.5 rounded-full border",
                          severityClass(row.severity),
                        ].join(" ")}
                      >
                        {row.severity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Setup instructions */}
      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-6">
          <h2 className="text-base font-bold text-white mb-2">
            Setup instructions
          </h2>
          <p className="text-sm text-ink-muted leading-relaxed mb-4">
            Each channel above is driven by a distinct Slack incoming webhook
            URL. To wire one up:
          </p>
          <ol className="text-sm text-ink-muted leading-relaxed space-y-2 list-decimal pl-5">
            <li>
              Open the Slack workspace admin →{" "}
              <Link
                href="https://api.slack.com/apps"
                className="text-brand-soft hover:underline font-mono"
                target="_blank"
                rel="noreferrer noopener"
              >
                api.slack.com/apps
              </Link>{" "}
              → select (or create) the Zerocast app.
            </li>
            <li>
              In the left rail, choose{" "}
              <span className="font-mono text-brand-soft">
                Incoming Webhooks
              </span>{" "}
              → toggle on → click{" "}
              <span className="font-mono text-brand-soft">
                Add New Webhook to Workspace
              </span>
              .
            </li>
            <li>
              Pick the target Slack channel (e.g.{" "}
              <span className="font-mono text-brand-soft">#beta-signups</span>)
              and authorize.
            </li>
            <li>
              Copy the generated webhook URL (starts with{" "}
              <span className="font-mono text-brand-soft">
                https://hooks.slack.com/
              </span>
              ).
            </li>
            <li>
              Set the URL as the matching env var in Vercel (e.g.{" "}
              <span className="font-mono text-brand-soft">
                SLACK_WEBHOOK_BETA_SIGNUPS
              </span>
              ) → redeploy.
            </li>
            <li>Come back here and hit the test button for that channel.</li>
          </ol>
          <p className="text-xs text-ink-faint leading-relaxed mt-4">
            Any channel without its env var set stays dark — no errors, no
            retries. The webhook URLs themselves are never sent to the client.
          </p>
        </div>
      </section>
    </div>
  );
}
