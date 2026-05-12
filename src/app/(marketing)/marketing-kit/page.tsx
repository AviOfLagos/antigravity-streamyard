import type { Metadata } from "next";
import {
  PulseRing,
  MultistreamFan,
  SignalArc,
} from "@/components/marketing/illustrations";

export const metadata: Metadata = {
  title: "Marketing Kit — Zerocast",
  description:
    "Download social cards, OG images, and embeddable brand assets for Zerocast. Generated from the Signal Static design system.",
  alternates: { canonical: "/marketing-kit" },
  robots: { index: false, follow: false },
};

const SCENES = [
  {
    id: "hero",
    label: "Hero / Launch",
    kicker: "Private Beta",
    blurb: "Top-of-funnel announcement. The headline card.",
  },
  {
    id: "multistream",
    label: "Multistream",
    kicker: "Feature",
    blurb: "Showcase the 4-platform + RTMP fan-out.",
  },
  {
    id: "ai-cohost",
    label: "AI Co-Host",
    kicker: "Feature",
    blurb: "The flagship AI moment.",
  },
  {
    id: "browser",
    label: "Browser-Native",
    kicker: "Positioning",
    blurb: "Anti-OBS, anti-hardware angle.",
  },
  {
    id: "beta",
    label: "Beta CTA",
    kicker: "Call to action",
    blurb: "Short, punchy beta-access push.",
  },
  {
    id: "quote",
    label: "Editorial / Quote",
    kicker: "Long-form",
    blurb: "Pull-quote for blog & thought-leadership posts.",
  },
] as const;

const VARIANTS = [
  { id: "square", label: "Square", size: "1080 × 1080", platforms: "IG feed · X post · LinkedIn post" },
  { id: "og", label: "OG / Link card", size: "1200 × 630", platforms: "Open Graph · X card · LinkedIn link" },
  { id: "story", label: "Story", size: "1080 × 1920", platforms: "IG / TikTok / Snapchat story" },
  { id: "banner", label: "Banner", size: "1500 × 500", platforms: "X header · LinkedIn cover" },
  { id: "portrait", label: "Portrait", size: "1080 × 1350", platforms: "IG portrait · Pinterest" },
] as const;

type Swatch = { name: string; className: string; border?: boolean };

const TOKEN_SWATCHES: Swatch[] = [
  { name: "surface", className: "bg-surface", border: true },
  { name: "surface-1", className: "bg-surface-1" },
  { name: "surface-2", className: "bg-surface-2" },
  { name: "surface-3", className: "bg-surface-3" },
  { name: "brand", className: "bg-brand" },
  { name: "brand-soft", className: "bg-brand-soft" },
  { name: "brand-softer", className: "bg-brand-softer" },
  { name: "brand-on-light", className: "bg-brand-on-light" },
  { name: "accent-purple", className: "bg-accent-purple" },
  { name: "accent-violet", className: "bg-accent-violet" },
  { name: "accent-blue", className: "bg-accent-blue" },
  { name: "success", className: "bg-success" },
  { name: "warn", className: "bg-warn" },
  { name: "danger", className: "bg-danger" },
];

export default function MarketingKitPage() {
  return (
    <div className="text-white">
      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative px-6 pt-28 pb-20 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute inset-0 -z-10 brand-glow-hero" />
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-soft border border-brand/20 rounded-full px-4 py-1.5 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-soft" />
          Marketing Kit
        </div>
        <h1
          className="font-black tracking-tighter leading-[1] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 84px)" }}
        >
          Signal Static —<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-soft to-accent-purple">
            assets for the field.
          </span>
        </h1>
        <p className="text-ink-muted text-lg max-w-2xl leading-relaxed">
          Social cards, OG images, and embeddable brand graphics generated from
          the design system. Pick a scene, pick a size, hit download. Every
          asset is rendered fresh on request — edit the route to remix on the fly.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4 text-sm">
          <a
            href="/docs/styleguide.md"
            className="inline-flex items-center gap-2 text-brand-soft hover:text-white transition-colors"
          >
            Style guide →
          </a>
          <span className="text-ink-fainter">/</span>
          <a
            href="/docs/design/philosophy.md"
            className="inline-flex items-center gap-2 text-brand-soft hover:text-white transition-colors"
          >
            Design philosophy →
          </a>
          <span className="text-ink-fainter">/</span>
          <a
            href="/og/marketing?variant=og&scene=hero"
            className="inline-flex items-center gap-2 text-brand-soft hover:text-white transition-colors"
            target="_blank"
            rel="noreferrer"
          >
            OG route →
          </a>
        </div>
      </section>

      {/* ── SOCIAL CARDS ────────────────────────────────── */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-16 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">
              Section 01
            </p>
            <h2
              className="font-black leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              Social cards
            </h2>
          </div>
          <p className="text-ink-muted text-sm max-w-md leading-relaxed">
            Six scenes × five sizes. Each preview is the live OG endpoint —
            right-click → save, or use the size buttons.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {SCENES.map((scene) => (
            <article key={scene.id} className="flex flex-col gap-5">
              <div className="relative w-full aspect-[1200/630] rounded-2xl overflow-hidden border border-white/8 bg-surface-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/og/marketing?variant=og&scene=${scene.id}`}
                  alt={`${scene.label} — OG card`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-1">
                    {scene.kicker}
                  </p>
                  <h3 className="font-bold text-lg">{scene.label}</h3>
                </div>
                <p className="text-ink-faint text-xs">{scene.blurb}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {VARIANTS.map((v) => (
                  <a
                    key={v.id}
                    href={`/og/marketing?variant=${v.id}&scene=${scene.id}`}
                    download={`zerocast-${scene.id}-${v.id}.png`}
                    className="inline-flex flex-col items-start gap-0.5 px-3 py-2 rounded-lg border border-white/8 hover:border-brand/40 hover:bg-brand/5 transition-colors"
                  >
                    <span className="text-xs font-semibold text-white">
                      {v.label}
                    </span>
                    <span className="text-[10px] font-mono text-ink-faint">
                      {v.size}
                    </span>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── EMBEDDED ILLUSTRATIONS ──────────────────────── */}
      <section className="px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex items-end justify-between gap-6 mb-16 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">
              Section 02
            </p>
            <h2
              className="font-black leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              Embedded illustrations
            </h2>
          </div>
          <p className="text-ink-muted text-sm max-w-md leading-relaxed">
            React components. Token-driven via <code className="text-brand-soft">currentColor</code>.
            Import from <code className="text-brand-soft">@/components/marketing/illustrations</code>.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <figure className="rounded-2xl border border-white/8 bg-surface-1/40 p-10 flex flex-col items-center gap-8">
            <div className="text-brand-soft">
              <PulseRing size={240} />
            </div>
            <figcaption className="text-center">
              <p className="font-bold mb-1">PulseRing</p>
              <p className="text-xs text-ink-faint font-mono">{`<PulseRing size={240} />`}</p>
            </figcaption>
          </figure>

          <figure className="rounded-2xl border border-white/8 bg-surface-1/40 p-10 flex flex-col items-center justify-center gap-8 md:col-span-2">
            <div className="text-brand-soft w-full">
              <MultistreamFan width={520} className="mx-auto" />
            </div>
            <figcaption className="text-center">
              <p className="font-bold mb-1">MultistreamFan</p>
              <p className="text-xs text-ink-faint font-mono">{`<MultistreamFan width={520} />`}</p>
            </figcaption>
          </figure>

          <figure className="rounded-2xl border border-white/8 bg-surface-1/40 p-10 flex flex-col items-center gap-6 md:col-span-3">
            <div className="text-brand-soft w-full">
              <SignalArc width={880} className="mx-auto" />
            </div>
            <figcaption className="text-center">
              <p className="font-bold mb-1">SignalArc</p>
              <p className="text-xs text-ink-faint font-mono">{`<SignalArc width={880} />`}</p>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── TOKEN SWATCHES ──────────────────────────────── */}
      <section className="px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
        <div className="flex items-end justify-between gap-6 mb-16 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">
              Section 03
            </p>
            <h2
              className="font-black leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              Color tokens
            </h2>
          </div>
          <p className="text-ink-muted text-sm max-w-md leading-relaxed">
            Full reference in <code className="text-brand-soft">docs/styleguide.md</code>.
            Tokens auto-generate Tailwind utilities (oklch base, alpha modifier works).
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {TOKEN_SWATCHES.map((t) => (
            <div key={t.name} className="flex flex-col gap-2">
              <div
                className={`aspect-square rounded-xl ${t.className} ${t.border ? "border border-white/10" : ""}`}
              />
              <p className="text-xs font-mono text-ink-muted">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── USAGE NOTES ─────────────────────────────────── */}
      <section className="px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-3">
              Section 04
            </p>
            <h2
              className="font-black leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)" }}
            >
              How to use this kit
            </h2>
          </div>
          <div className="space-y-8 text-ink-muted text-sm leading-relaxed">
            <div>
              <p className="text-white font-bold text-base mb-2">
                Posting to socials
              </p>
              <p>
                Click any size button under a scene above. The PNG renders on
                demand from <code className="text-brand-soft">/og/marketing</code>. Save the file, upload to the
                target platform. Sizes already match each platform&apos;s native spec.
              </p>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-2">
                Custom copy
              </p>
              <p>
                Override any text via query params:
              </p>
              <pre className="mt-3 p-4 rounded-lg bg-surface-2 border border-white/8 text-xs font-mono text-brand-softer overflow-x-auto">
                {`/og/marketing?variant=square&scene=hero
  &title=Launch%20Day
  &accent=Ship%20it.
  &kicker=Today
  &sub=Custom%20subtitle%20here.`}
              </pre>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-2">
                Embedding illustrations on platform pages
              </p>
              <pre className="p-4 rounded-lg bg-surface-2 border border-white/8 text-xs font-mono text-brand-softer overflow-x-auto">
                {`import { PulseRing } from "@/components/marketing/illustrations";

<div className="text-brand-soft">
  <PulseRing size={320} />
</div>`}
              </pre>
              <p className="mt-3">
                Color comes from <code className="text-brand-soft">currentColor</code> — set <code className="text-brand-soft">text-brand</code>,
                <code className="text-brand-soft">text-brand-soft</code>, or any ink token on the parent to recolor.
              </p>
            </div>
            <div>
              <p className="text-white font-bold text-base mb-2">
                Adding a new scene
              </p>
              <p>
                Add an entry to <code className="text-brand-soft">SCENES</code> in <code className="text-brand-soft">src/app/og/marketing/route.tsx</code>,
                then mirror it in this page&apos;s <code className="text-brand-soft">SCENES</code> array. Variants are shared.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
