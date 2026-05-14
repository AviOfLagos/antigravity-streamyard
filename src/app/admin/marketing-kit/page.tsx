import type { Metadata } from "next";
import {
  Sparkles,
  Mail,
  Film,
  Mic,
  Send,
  Layers,
  MessageSquare,
  Sticker,
  Megaphone,
  Image as ImageIcon,
  Wand2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Marketing Kit — Zerocast Admin",
  description:
    "Generate social cards, OG images, and campaign assets from the Signal Static design system.",
  robots: { index: false, follow: false },
};

/* ─── scenes (rendered via /og/marketing) ────────────────────────── */

type Scene = {
  id: string;
  label: string;
  kicker: string;
  blurb: string;
  group?: "general" | "product-hunt";
  // If set, only these variant ids appear on the scene's download row.
  // Undefined → standard variants (general scenes use the social-card set).
  variants?: string[];
};

const SCENES: Scene[] = [
  {
    id: "hero",
    label: "Hero / Launch",
    kicker: "Private Beta",
    blurb: "Top-of-funnel announcement.",
  },
  {
    id: "multistream",
    label: "Multistream",
    kicker: "Feature",
    blurb: "Four-platform fan-out.",
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
    label: "Editorial Quote",
    kicker: "Long-form",
    blurb: "Pull-quote for blog + thought-leadership.",
  },
  // ─── Product Hunt kit ─────────────────────────────────────────
  {
    id: "ph-launch",
    label: "PH — Launch announce",
    kicker: "Live on Product Hunt",
    blurb:
      "Launch-day push. Use ph-gallery as the PH gallery hero, og/square for cross-posting.",
    group: "product-hunt",
    variants: ["ph-gallery", "ph-thumb", "og", "square", "story"],
  },
  {
    id: "ph-maker",
    label: "PH — Maker comment",
    kicker: "From the maker",
    blurb:
      "Companion image for the Maker comment on PH (founder pull-quote).",
    group: "product-hunt",
    variants: ["ph-gallery", "square", "og"],
  },
];

type Variant = {
  id: string;
  label: string;
  size: string;
  platforms: string;
};

const VARIANTS: Variant[] = [
  { id: "square", label: "1:1", size: "1080×1080", platforms: "IG · X · LinkedIn" },
  { id: "og", label: "OG", size: "1200×630", platforms: "Link card / OG" },
  { id: "story", label: "Story", size: "1080×1920", platforms: "IG / TikTok / Snap" },
  { id: "banner", label: "Banner", size: "1500×500", platforms: "X / LinkedIn cover" },
  { id: "portrait", label: "4:5", size: "1080×1350", platforms: "IG portrait" },
  { id: "ph-gallery", label: "PH Gallery", size: "1270×760", platforms: "Product Hunt gallery hero" },
  { id: "ph-thumb", label: "PH Thumb", size: "240×240", platforms: "Product Hunt thumbnail" },
];

const VARIANTS_BY_ID = Object.fromEntries(VARIANTS.map((v) => [v.id, v]));
const DEFAULT_VARIANT_IDS = ["square", "og", "story", "banner", "portrait"];

/* ─── campaign concept scaffolding ───────────────────────────────── */

type CampaignStatus = "shipped" | "in-design" | "planned";

type Campaign = {
  id: string;
  title: string;
  blurb: string;
  icon: React.ElementType;
  status: CampaignStatus;
  surface: "social" | "email" | "video" | "print" | "in-app";
};

const CAMPAIGNS: Campaign[] = [
  {
    id: "social-cards",
    title: "Social card system",
    blurb:
      "Eight scenes × seven sizes (incl. Product Hunt gallery + thumb) via /og/marketing. Live and renderable from this page.",
    icon: ImageIcon,
    status: "shipped",
    surface: "social",
  },
  {
    id: "product-hunt-kit",
    title: "Product Hunt launch kit",
    blurb:
      "Gallery hero (1270×760), thumbnail (240×240), launch-announce scene + Maker comment scene. Renderable from the social-cards section above.",
    icon: Sparkles,
    status: "shipped",
    surface: "social",
  },
  {
    id: "email-header-system",
    title: "Email header system",
    blurb:
      "600px-wide announcement headers in three flavors: feature drop, beta invite, milestone.",
    icon: Mail,
    status: "planned",
    surface: "email",
  },
  {
    id: "lottie-reel",
    title: "Animated banner reel",
    blurb:
      "Lottie loops for stream-deck overlays — pulse ring breathing, multistream fan-out, AI-cohost spark.",
    icon: Film,
    status: "in-design",
    surface: "video",
  },
  {
    id: "podcast-cover-series",
    title: "Podcast cover series",
    blurb:
      "3000×3000 episode covers — episode number, guest name, signal-arc backdrop.",
    icon: Mic,
    status: "planned",
    surface: "social",
  },
  {
    id: "x-video-teaser",
    title: "Beta wait-list teaser",
    blurb:
      "9-second silent loop for X / Bluesky / Threads. Headline reveal + co-host pulse.",
    icon: Send,
    status: "planned",
    surface: "video",
  },
  {
    id: "overlay-templates",
    title: "Stream-overlay templates",
    blurb:
      "Browser-source overlays: starting soon, brb, intermission, ending — token-driven.",
    icon: Layers,
    status: "planned",
    surface: "in-app",
  },
  {
    id: "community-pack",
    title: "Slack / Discord asset pack",
    blurb:
      "Server icon, channel banner, role badges, emoji set — for community moderators.",
    icon: MessageSquare,
    status: "planned",
    surface: "in-app",
  },
  {
    id: "sticker-set",
    title: "Brand sticker pack",
    blurb:
      "Die-cut PNGs (4×4in) — wordmark, pulse ring, “co-host with AI” line. Sticker Mule ready.",
    icon: Sticker,
    status: "planned",
    surface: "print",
  },
  {
    id: "conference-backdrop",
    title: "Conference backdrop",
    blurb:
      "10×8ft step-and-repeat for booth photo ops. Tiled wordmark + signal-arc pattern.",
    icon: Megaphone,
    status: "planned",
    surface: "print",
  },
  {
    id: "in-app-empty-states",
    title: "In-app empty-state set",
    blurb:
      "Illustration kit for dashboard zero-states: no rooms, no recordings, no chat history.",
    icon: Wand2,
    status: "planned",
    surface: "in-app",
  },
];

const STATUS_STYLES: Record<
  CampaignStatus,
  { label: string; cls: string }
> = {
  shipped: {
    label: "Shipped",
    cls: "bg-success/10 text-success-text border-success/30",
  },
  "in-design": {
    label: "In design",
    cls: "bg-warn/10 text-warn-text border-warn/30",
  },
  planned: {
    label: "Planned",
    cls: "bg-brand/10 text-brand-soft border-brand/30",
  },
};

const SURFACE_LABEL: Record<Campaign["surface"], string> = {
  social: "Social",
  email: "Email",
  video: "Video",
  print: "Print",
  "in-app": "In-app",
};

/* ─── token swatch strip (compact) ───────────────────────────────── */

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

/* ─── page ───────────────────────────────────────────────────────── */

export default function MarketingKitPage() {
  return (
    <div className="text-white">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative px-6 pt-20 pb-14 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute inset-0 -z-10 brand-glow-section" />
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-soft border border-brand/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-soft" />
              Marketing Kit
            </div>
            <h1
              className="font-black tracking-tighter leading-[1] mb-5"
              style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
            >
              Signal Static —<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-soft to-accent-purple">
                campaign assets.
              </span>
            </h1>
            <p className="text-ink-muted max-w-xl leading-relaxed">
              Social cards, OG images, and campaign concepts driven by the
              design system. Generate any (scene × size) on demand. Scaffold
              new campaign ideas as concept tiles before designing them.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-xs font-mono text-ink-faint">
            <span>docs/styleguide.md</span>
            <span>docs/design/philosophy.md</span>
            <a
              href="/og/marketing?variant=og&scene=hero"
              className="text-brand-soft hover:text-white transition-colors"
              target="_blank"
              rel="noreferrer"
            >
              /og/marketing →
            </a>
          </div>
        </div>
      </section>

      {/* ── SOCIAL CARDS — 3-col grid ────────────────────────── */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap pb-5 border-b border-white/8">
          <div className="flex items-baseline gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-soft">
              01
            </span>
            <h2 className="font-bold text-2xl tracking-tight">Social cards</h2>
            <span className="text-xs font-mono text-ink-faint">
              {SCENES.length} scenes · {VARIANTS.length} sizes
            </span>
          </div>
          <p className="text-ink-muted text-sm">
            Generated by <code className="text-brand-soft">/og/marketing</code>{" "}
            — click any size pill to download.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SCENES.map((scene) => {
            const sceneVariants = (scene.variants ?? DEFAULT_VARIANT_IDS)
              .map((id) => VARIANTS_BY_ID[id])
              .filter(Boolean);
            const previewVariant =
              scene.group === "product-hunt" ? "ph-gallery" : "og";
            const previewAspect =
              scene.group === "product-hunt" ? "aspect-[1270/760]" : "aspect-[1200/630]";
            return (
              <article
                key={scene.id}
                className={`flex flex-col gap-3 rounded-xl border bg-surface-1/40 p-4 hover:border-brand/30 transition-colors ${
                  scene.group === "product-hunt"
                    ? "border-brand/30"
                    : "border-white/8"
                }`}
              >
                <div className={`relative w-full ${previewAspect} rounded-lg overflow-hidden border border-white/8 bg-surface-1`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/og/marketing?variant=${previewVariant}&scene=${scene.id}`}
                    alt={`${scene.label} — preview`}
                    className="w-full h-full object-cover"
                  />
                  {scene.group === "product-hunt" ? (
                    <span className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-brand text-white">
                      Product Hunt
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-bold text-sm text-white">{scene.label}</h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-soft">
                    {scene.kicker}
                  </span>
                </div>
                <p className="text-ink-faint text-xs leading-relaxed">
                  {scene.blurb}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {sceneVariants.map((v) => (
                    <a
                      key={v.id}
                      href={`/og/marketing?variant=${v.id}&scene=${scene.id}`}
                      download={`zerocast-${scene.id}-${v.id}.png`}
                      title={`${v.size} — ${v.platforms}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-white/8 hover:border-brand/40 hover:bg-brand/5 transition-colors text-[10px] font-mono"
                    >
                      <span className="font-bold text-white">{v.label}</span>
                      <span className="text-ink-faint">{v.size}</span>
                    </a>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── CAMPAIGN CONCEPTS — scaffolding for new ideas ───── */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap pb-5 border-b border-white/8">
          <div className="flex items-baseline gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-soft">
              02
            </span>
            <h2 className="font-bold text-2xl tracking-tight">
              Campaign concepts
            </h2>
            <span className="text-xs font-mono text-ink-faint">
              {CAMPAIGNS.length} ideas ·{" "}
              {CAMPAIGNS.filter((c) => c.status === "shipped").length} shipped ·{" "}
              {CAMPAIGNS.filter((c) => c.status === "in-design").length} in
              design ·{" "}
              {CAMPAIGNS.filter((c) => c.status === "planned").length} planned
            </span>
          </div>
          <p className="text-ink-muted text-sm max-w-md">
            Scaffold the next asset before designing it. Edit{" "}
            <code className="text-brand-soft">CAMPAIGNS</code> in this file to
            add tiles.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CAMPAIGNS.map((c) => {
            const Icon = c.icon;
            const status = STATUS_STYLES[c.status];
            return (
              <div
                key={c.id}
                className="group flex flex-col gap-4 rounded-xl border border-white/8 bg-surface-1/40 p-5 hover:border-brand/30 hover:bg-surface-1 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand-soft">
                    <Icon size={16} />
                  </div>
                  <span
                    className={`inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white mb-1.5">
                    {c.title}
                  </h3>
                  <p className="text-ink-muted text-xs leading-relaxed">
                    {c.blurb}
                  </p>
                </div>
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint">
                    {SURFACE_LABEL[c.surface]}
                  </span>
                  <span className="text-[10px] font-mono text-ink-faint">
                    {c.id}
                  </span>
                </div>
              </div>
            );
          })}

          {/* placeholder "add new" tile — visual cue for future ideas */}
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-surface-1/20 p-5 text-center min-h-[180px]">
            <Sparkles size={18} className="text-ink-faint" />
            <p className="text-xs font-bold text-ink-muted">Add a concept</p>
            <p className="text-[11px] text-ink-faint leading-relaxed max-w-[180px]">
              Append a new entry to{" "}
              <code className="text-brand-soft/80">CAMPAIGNS</code> in this
              page to scaffold it.
            </p>
          </div>
        </div>
      </section>

      {/* ── DESIGN SYSTEM — compact strip ────────────────────── */}
      <section className="px-6 pb-20 max-w-7xl mx-auto">
        <div className="flex items-end justify-between gap-6 mb-10 flex-wrap pb-5 border-b border-white/8">
          <div className="flex items-baseline gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-soft">
              03
            </span>
            <h2 className="font-bold text-2xl tracking-tight">
              Design system
            </h2>
          </div>
          <p className="text-ink-muted text-sm">
            Full reference in{" "}
            <code className="text-brand-soft">docs/styleguide.md</code>.
          </p>
        </div>

        <div className="grid grid-cols-7 md:grid-cols-14 gap-2">
          {TOKEN_SWATCHES.map((t) => (
            <div
              key={t.name}
              className="flex flex-col items-center gap-1.5"
              title={t.name}
            >
              <div
                className={`w-full aspect-square rounded-lg ${t.className} ${
                  t.border ? "border border-white/10" : ""
                }`}
              />
              <p className="text-[9px] font-mono text-ink-faint truncate w-full text-center">
                {t.name}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/8 bg-surface-2/60 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-3">
              Custom copy
            </p>
            <pre className="text-[11px] font-mono text-brand-softer leading-relaxed overflow-x-auto">
              {`/og/marketing?variant=square&scene=hero
  &title=Launch%20Day
  &accent=Ship%20it.
  &kicker=Today`}
            </pre>
          </div>
          <div className="rounded-xl border border-white/8 bg-surface-2/60 p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-3">
              Inline illustrations
            </p>
            <pre className="text-[11px] font-mono text-brand-softer leading-relaxed overflow-x-auto">
              {`import { SignalArc } from
  "@/components/marketing/illustrations";

<div className="text-brand-soft/40">
  <SignalArc width={1200} />
</div>`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
