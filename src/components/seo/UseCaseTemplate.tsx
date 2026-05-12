import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

interface Props {
  kicker: string;
  headline: React.ReactNode;
  intro: string;
  painPoints: { title: string; body: string }[];
  features: { label: string; desc: string }[];
  faqs: { q: string; a: string }[];
  ctaLabel?: string;
}

export function UseCaseTemplate({
  kicker,
  headline,
  intro,
  painPoints,
  features,
  faqs,
  ctaLabel = "Join the Beta",
}: Props) {
  return (
    <div className="text-white selection:bg-brand/30">
      <section className="px-6 pt-24 pb-12 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">{kicker}</p>
        <h1
          className="font-black text-white tracking-tight leading-[0.95] mb-8"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}
        >
          {headline}
        </h1>
        <p className="text-ink-muted text-xl max-w-2xl leading-relaxed">{intro}</p>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-12">The friction today</p>
        <div className="grid md:grid-cols-3 gap-0">
          {painPoints.map((p, i) => (
            <div key={p.title} className={`py-8 ${i > 0 ? "border-l border-white/5 pl-10" : "pr-10"}`}>
              <span className="text-xs font-black text-ink-fainter tabular-nums block mb-3">0{i + 1}</span>
              <p className="font-bold text-white text-lg mb-3">{p.title}</p>
              <p className="text-ink-subtle text-sm leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-2/30 border-y border-white/5 px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-12">How Zerocast fits</p>
          <div className="space-y-0">
            {features.map((feat) => (
              <div
                key={feat.label}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-8 border-t border-white/5"
              >
                <div className="flex items-start gap-6">
                  <Check size={18} className="text-brand-soft mt-1 shrink-0" />
                  <div>
                    <p className="font-bold text-white text-lg mb-1">{feat.label}</p>
                    <p className="text-ink-subtle text-sm leading-relaxed max-w-2xl">{feat.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-12">FAQ</p>
        <div className="space-y-10">
          {faqs.map((f) => (
            <div key={f.q} className="border-b border-white/5 pb-8 last:border-0">
              <h3 className="font-bold text-white text-lg mb-3">{f.q}</h3>
              <p className="text-ink-muted text-sm leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <h2 className="font-black text-white text-4xl tracking-tight">Try it during the beta.</h2>
        <Link
          href="?beta=true"
          scroll={false}
          className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all"
        >
          {ctaLabel} <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
