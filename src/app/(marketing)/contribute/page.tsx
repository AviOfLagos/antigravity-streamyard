import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Contribute | Zerocast — Build With Us",
  description: "Help build the future of AI-automated live streaming. Developers, designers, and creators welcome.",
};

export default function ContributePage() {
  return (
    <div className="text-white selection:bg-brand/30">

      <section className="px-6 pt-24 pb-20 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Open Source</p>
        <h1 className="font-black text-white tracking-tight leading-[0.9] mb-12"
          style={{ fontSize: "clamp(52px, 9vw, 120px)" }}>
          Build<br />with us.
        </h1>
        <p className="text-ink-muted text-xl max-w-xl leading-relaxed border-l-2 border-white/10 pl-6">
          Zerocast thrives on community. Whether you code, design, or create — there&apos;s a meaningful way to shape the ultimate broadcasting tool.
        </p>
      </section>

      {/* Contribution tracks */}
      <section className="border-t border-white/5 px-6 py-24 bg-surface-1/40">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-16">How to contribute</p>
          <div className="space-y-0">
            {[
              {
                role: "Developers",
                color: "text-accent-blue",
                desc: "Write code, fix bugs, or build new AI integrations. Check the GitHub repo for issues tagged 'good first issue' and 'ai-integration'.",
                cta: "View Repository",
                href: "https://github.com/AviOfLagos/zerocast",
                external: true,
              },
              {
                role: "Creators",
                color: "text-success-text",
                desc: "Stress-test beta releases, provide detailed feedback on the AI features, and help us understand what real streamers actually need.",
                cta: "Join the Beta",
                href: "?beta=true",
                external: false,
              },
              {
                role: "Designers",
                color: "text-accent-pink",
                desc: "Refine the studio UI/UX, design new layout presets, create WebGL animations, or help shape our visual identity.",
                cta: "Email the Design Team",
                href: "mailto:avi@nexprove.com",
                external: true,
              },
            ].map((track, i) => (
              <div key={track.role} className="flex flex-col md:flex-row gap-8 py-12 border-t border-white/5">
                <div className="md:w-64 shrink-0">
                  <span className="text-xs font-black text-ink-fainter tabular-nums block mb-2">0{i + 1}</span>
                  <p className={`font-black text-3xl tracking-tight ${track.color}`}>{track.role}</p>
                </div>
                <div className="flex-1 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <p className="text-ink-subtle text-sm leading-relaxed max-w-xl">{track.desc}</p>
                  <Link
                    href={track.href}
                    scroll={false}
                    target={track.external ? "_blank" : undefined}
                    rel={track.external ? "noreferrer" : undefined}
                    className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-ink-emphasis hover:text-white transition-colors group"
                  >
                    {track.cta} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contribution guidelines */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Guidelines</p>
            <div className="space-y-6">
              {[
                ["Read CONTRIBUTING.md", "All contribution expectations and code standards are documented in the repo."],
                ["Open an issue first", "For large changes, discuss the approach with maintainers before writing code."],
                ["Small PRs win", "Focused, well-scoped pull requests get reviewed and merged faster."],
              ].map(([title, desc]) => (
                <div key={title} className="border-t border-white/5 pt-6">
                  <p className="font-semibold text-white mb-1">{title}</p>
                  <p className="text-ink-subtle text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="border-l border-white/5 pl-20">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Tech Stack</p>
            <div className="space-y-4 text-sm text-ink-subtle">
              {["Next.js 15 (App Router)", "React 19", "LiveKit (WebRTC)", "Neon Postgres + Prisma", "Upstash Redis", "Tailwind CSS v4", "Google Gemini (AI)"].map((tech) => (
                <div key={tech} className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                  {tech}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
