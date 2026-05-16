import { ExternalLink, BarChart2, Info } from "lucide-react";

export const dynamic = "force-dynamic";

// Paste public-share URLs from PostHog → Dashboard → Share → Public link.
const PUBLIC_DASHBOARD_URLS: Record<string, string | undefined> = {
  acquisition: process.env.POSTHOG_DASHBOARD_ACQUISITION,
  beta_signup_funnel: process.env.POSTHOG_DASHBOARD_BETA_FUNNEL,
  activation_funnel: process.env.POSTHOG_DASHBOARD_ACTIVATION,
  engagement: process.env.POSTHOG_DASHBOARD_ENGAGEMENT,
  retention: process.env.POSTHOG_DASHBOARD_RETENTION,
  product_health: process.env.POSTHOG_DASHBOARD_PRODUCT_HEALTH,
};

const DASHBOARDS: Array<{
  key: keyof typeof PUBLIC_DASHBOARD_URLS;
  title: string;
  description: string;
}> = [
  {
    key: "acquisition",
    title: "Acquisition",
    description: "Traffic sources, landing pages, and top-of-funnel volume.",
  },
  {
    key: "beta_signup_funnel",
    title: "Beta Signup Funnel",
    description: "Visit → modal open → form submit conversion path.",
  },
  {
    key: "activation_funnel",
    title: "Activation Funnel",
    description: "First-session activation events through to value-realized.",
  },
  {
    key: "engagement",
    title: "Engagement",
    description: "DAU, WAU, MAU and session depth across cohorts.",
  },
  {
    key: "retention",
    title: "Retention",
    description: "Day-N return curves segmented by signup cohort.",
  },
  {
    key: "product_health",
    title: "Product Health",
    description: "Error rates, latency, and core-flow success metrics.",
  },
];

function buildExternalUrl(): string {
  const projectId = process.env.POSTHOG_PROJECT_ID;
  if (projectId) {
    return `https://us.posthog.com/project/${projectId}`;
  }
  return "https://us.posthog.com";
}

export default function PostHogDashboardsAdmin() {
  // Auth handled by /admin/layout.tsx via requireAdmin().
  const externalUrl = buildExternalUrl();
  const hasProjectId = Boolean(process.env.POSTHOG_PROJECT_ID);

  return (
    <div className="text-white">
      <section className="px-6 pt-16 pb-8 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
          Admin · PostHog
        </p>
        <h1
          className="font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
        >
          PostHog Dashboards
        </h1>
        <p className="text-ink-muted max-w-2xl mb-12 leading-relaxed">
          Stop-gap embed of PostHog Cloud dashboards. Use the external link for
          full-fidelity exploration; embeds below give an at-a-glance view
          inside adminOS.
        </p>
      </section>

      <section className="px-6 pb-12 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
              <ExternalLink size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-1.5">
                Open PostHog Cloud
              </h2>
              <p className="text-sm text-ink-muted leading-relaxed">
                {hasProjectId
                  ? "Jumps directly to the linked project."
                  : "POSTHOG_PROJECT_ID is unset — falls back to us.posthog.com root. Set the env var to link straight to the project."}
              </p>
            </div>
          </div>
          <a
            href={externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand/10 border border-brand/30 text-brand-soft hover:bg-brand/20 hover:text-white transition-colors text-sm font-semibold whitespace-nowrap"
          >
            Open
            <ExternalLink size={14} />
          </a>
        </div>
      </section>

      <section className="px-6 pb-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Embedded dashboards
          </h2>
          <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono">
            {DASHBOARDS.length} dashboards
          </span>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {DASHBOARDS.map((d) => {
            const url = PUBLIC_DASHBOARD_URLS[d.key];
            return (
              <div
                key={d.key}
                className="rounded-2xl border border-white/8 bg-surface-1/40 overflow-hidden flex flex-col"
              >
                <div className="px-5 py-4 border-b border-white/5 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {d.title}
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      {d.description}
                    </p>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-ink-faint font-mono shrink-0">
                    {d.key}
                  </span>
                </div>
                {url ? (
                  <div className="aspect-video bg-black/40">
                    <iframe
                      src={url}
                      title={`PostHog dashboard — ${d.title}`}
                      loading="lazy"
                      sandbox="allow-scripts allow-same-origin"
                      width="100%"
                      height="100%"
                      className="w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-black/20 flex items-center justify-center p-6">
                    <div className="max-w-sm text-center">
                      <div className="w-10 h-10 mx-auto rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-ink-muted mb-4">
                        <BarChart2 size={18} />
                      </div>
                      <p className="text-sm font-semibold text-white mb-2">
                        Not yet shared
                      </p>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        In PostHog, open this dashboard → Share → enable public
                        link → paste the URL into the{" "}
                        <code className="text-brand-soft font-mono">
                          PUBLIC_DASHBOARD_URLS
                        </code>{" "}
                        map in this file&apos;s source.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-white/8 bg-surface-1/40 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft shrink-0">
            <Info size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1.5">
              Next step — native dashboards
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed">
              This page is a Phase 3 Wave A stop-gap. Phase 3 Wave B replaces
              these iframes with first-party admin views at{" "}
              <code className="text-brand-soft font-mono text-xs">
                /admin/analytics
              </code>
              ,{" "}
              <code className="text-brand-soft font-mono text-xs">
                /admin/funnel
              </code>
              , and{" "}
              <code className="text-brand-soft font-mono text-xs">
                /admin/sources
              </code>
              . See the dashboard spec at{" "}
              <code className="text-brand-soft font-mono text-xs">
                doc/analytics/posthog-dashboards.md
              </code>{" "}
              (gitignored — local-only) for the full event/property contract.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
