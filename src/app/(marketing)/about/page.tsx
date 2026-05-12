import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Zerocast",
  description: "We&apos;re building the future of live streaming — AI-automated, browser-native, creator-first.",
};

export default function AboutPage() {
  return (
    <div className="text-white selection:bg-brand/30">

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">About Zerocast</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-12"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>
          Broadcasting,<br />
          <span className="text-ink-faint">Automated.</span>
        </h1>
        <p className="text-ink-muted text-xl max-w-xl leading-relaxed border-l-2 border-brand pl-6">
          We started Zerocast as a product of NexProve because running a live stream as a solo creator is genuinely hard — you&apos;re expected to manage production, moderate a chat moving at 100 messages a minute, and be entertaining at the same time.
        </p>
      </section>

      {/* Mission section */}
      <section className="border-t border-white/5 px-6 py-24 bg-surface-1/40">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Our Mission</p>
            <p className="text-white text-2xl font-semibold leading-relaxed">
              To give every solo creator access to a production team — without the production team.
            </p>
          </div>
          <div className="space-y-6 text-ink-subtle text-sm leading-relaxed">
            <p>
              We believe the best streamers shouldn&apos;t have to split their attention between making great content and operating complex tooling. That&apos;s a job for software.
            </p>
            <p>
              Zerocast&apos;s AI Co-Host is the first system purpose-built to understand the context of a live stream — who you are, what you&apos;re talking about, and how you want to come across — and act on that in real time.
            </p>
            <p>
              We&apos;re building in public and in beta. Come help us get it right.
            </p>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-16">What we stand for</p>
        <div className="space-y-0">
          {[
            ["Streamlined Creation", "Browser-first means zero friction. Open a tab, go live. No installs, no hardware, no excuses."],
            ["AI-Powered Moderation", "Context-aware AI that understands your stream — not just a word filter dressed up as intelligence."],
            ["Community-Built", "Zerocast is open and growing. We build with creators, not just for them."],
          ].map(([title, desc], i) => (
            <div key={title} className="flex gap-8 py-10 border-t border-white/5">
              <span className="text-xs font-black text-ink-fainter tabular-nums mt-1 shrink-0">0{i + 1}</span>
              <div>
                <p className="font-bold text-white text-xl mb-3">{title}</p>
                <p className="text-ink-subtle text-sm leading-relaxed max-w-xl">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-20 bg-surface-1/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-black text-white text-4xl tracking-tight">Ready to join the beta?</h2>
          <Link
            href="?beta=true"
            scroll={false}
            className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all"
          >
            Request Access <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
