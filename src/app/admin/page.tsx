import Link from "next/link";
import { Mail, Palette, ArrowRight, AlertTriangle, BarChart2, Activity, ShieldAlert } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { getRecentErrors } from "@/lib/errors";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [betaCount, recentBeta, errors] = await Promise.all([
    prisma.betaRequest.count(),
    prisma.betaRequest.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    getRecentErrors(200),
  ]);

  const errorCount = errors.length;
  const lastError = errors[0];

  const tools = [
    {
      href: "/admin/beta-requests",
      icon: Mail,
      title: "Beta Requests",
      blurb: "Inbound applications from the Private Beta form.",
      stat: `${betaCount} ${betaCount === 1 ? "request" : "requests"}`,
      sub: recentBeta
        ? `Latest ${recentBeta.createdAt.toISOString().slice(0, 10)}`
        : "No requests yet",
    },
    {
      href: "/admin/errors",
      icon: AlertTriangle,
      title: "Errors",
      blurb:
        "Client + server runtime errors captured by the beacon + Next.js instrumentation hook.",
      stat: `${errorCount} ${errorCount === 1 ? "error" : "errors"}`,
      sub: lastError
        ? `Latest ${new Date(lastError.ts).toISOString().slice(0, 10)}`
        : "Quiet — none captured yet",
    },
    {
      href: "/admin/marketing-kit",
      icon: Palette,
      title: "Marketing Kit",
      blurb:
        "Generate social cards, OG images, and brand assets from the design system.",
      stat: "8 scenes · 7 sizes",
      sub: "Signal Static design system",
    },
    {
      href: "/admin/posthog",
      icon: BarChart2,
      title: "PostHog Dashboards",
      blurb:
        "Embedded PostHog dashboards for funnels, retention, and product health.",
      stat: "6 dashboards",
      sub: "External + embed",
    },
    {
      href: "/admin/analytics",
      icon: Activity,
      title: "Analytics",
      blurb:
        "Visitor counts, signup conversion, traffic sources, daily trends.",
      stat: "Realtime",
      sub: "PostHog + DB",
    },
    {
      href: "/admin/abuse",
      icon: ShieldAlert,
      title: "Abuse Monitor",
      blurb: "Rate-limit hits, top offenders, hot endpoints, traffic spikes.",
      stat: "Realtime",
      sub: "DB-sourced",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
        adminOS
      </p>
      <h1
        className="font-black text-white tracking-tight leading-[1.05] mb-4"
        style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
      >
        Operations console
      </h1>
      <p className="text-ink-muted max-w-2xl mb-16 leading-relaxed">
        Internal tools for the Zerocast team. Everything here is gated by the
        admin allow-list — extend in <code className="text-brand-soft font-mono text-sm">src/lib/admin.ts</code>.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group rounded-2xl border border-white/8 bg-surface-1/40 p-6 hover:border-brand/40 hover:bg-surface-1 transition-colors flex flex-col gap-5"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft">
                  <Icon size={18} />
                </div>
                <ArrowRight
                  size={16}
                  className="text-ink-faint group-hover:text-brand-soft group-hover:translate-x-1 transition-all"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white mb-1.5">
                  {t.title}
                </h2>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {t.blurb}
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 flex items-baseline justify-between">
                <span className="text-sm font-mono font-semibold text-brand-soft">
                  {t.stat}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-ink-faint">
                  {t.sub}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
