import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing — Free during Private Beta",
  description:
    "Zerocast is currently in private beta and free for all participants. Public pricing tiers (Free, Creator, Studio) launch later in 2026. Reserve your spot.",
  alternates: { canonical: "/pricing" },
};

const tiers = [
  {
    name: "Beta",
    badge: "Available Now",
    price: "Free",
    cadence: "while in private beta",
    description:
      "Full access to every feature for early creators helping us shape the product.",
    features: [
      "Unlimited streaming hours",
      "Multistream to 4 platforms + custom RTMP",
      "Up to 5 guests on stage",
      "AI Co-Host with Tone Matching",
      "Cloud recording (1080p)",
      "Direct line to the founding team",
    ],
    cta: { label: "Request Access", href: "?beta=true" },
    highlight: true,
  },
  {
    name: "Free",
    badge: "Launching 2026",
    price: "$0",
    cadence: "forever, with watermark",
    description: "For hobbyists and weekend streamers testing the waters.",
    features: [
      "20 hours/month streaming",
      "2 platforms simultaneously",
      "2 guests on stage",
      "AI replies (50/month)",
      "Watermarked output",
    ],
    cta: { label: "Join the Waitlist", href: "?beta=true" },
    highlight: false,
  },
  {
    name: "Creator",
    badge: "Launching 2026",
    price: "$24",
    cadence: "per month, billed annually",
    description: "For active streamers running a weekly cadence.",
    features: [
      "Unlimited streaming",
      "All 4 native platforms + custom RTMP",
      "5 guests on stage",
      "Unlimited AI Co-Host usage",
      "Cloud recordings (1080p)",
      "Custom branding",
    ],
    cta: { label: "Join the Waitlist", href: "?beta=true" },
    highlight: false,
  },
  {
    name: "Studio",
    badge: "Launching 2026",
    price: "$79",
    cadence: "per month, billed annually",
    description: "For agencies and creators running multiple channels.",
    features: [
      "Everything in Creator",
      "5 brand profiles / channels",
      "4K cloud recordings",
      "Team seats (3 included)",
      "Priority egress queue",
      "Dedicated support",
    ],
    cta: { label: "Talk to Sales", href: "/contact" },
    highlight: false,
  },
];

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Zerocast",
  description:
    "Browser-based live streaming studio with built-in AI Co-Host. Multistream to YouTube, Twitch, Kick, TikTok, and custom RTMP destinations.",
  brand: { "@type": "Brand", name: "Zerocast" },
  offers: [
    {
      "@type": "Offer",
      name: "Beta",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    {
      "@type": "Offer",
      name: "Creator",
      price: "24",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
    {
      "@type": "Offer",
      name: "Studio",
      price: "79",
      priceCurrency: "USD",
      availability: "https://schema.org/PreOrder",
    },
  ],
};

export default function PricingPage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">
      <Script
        id="pricing-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      <section className="px-6 pt-24 pb-12 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Pricing</p>
        <h1
          className="font-black text-white tracking-tight leading-[0.95] mb-6"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}
        >
          Free while we&apos;re in beta.<br />
          <span className="text-neutral-600">Fair when we&apos;re not.</span>
        </h1>
        <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">
          Beta participants get full Zerocast — every feature, every platform, every AI capability — at no cost. Public pricing launches later in 2026; lock in early-adopter rates by joining now.
        </p>
      </section>

      <section className="px-6 pb-28 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col p-8 rounded-2xl border ${tier.highlight ? "border-indigo-500/40 bg-indigo-500/5" : "border-white/5 bg-white/[0.02]"}`}
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-white text-lg">{tier.name}</p>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${tier.highlight ? "bg-indigo-500/20 text-indigo-300" : "bg-white/5 text-neutral-500"}`}>
                  {tier.badge}
                </span>
              </div>
              <p className="font-black text-white text-5xl tracking-tight mb-1">{tier.price}</p>
              <p className="text-xs text-neutral-500 mb-6">{tier.cadence}</p>
              <p className="text-sm text-neutral-400 mb-6 leading-relaxed">{tier.description}</p>
              <ul className="space-y-3 mb-8 text-sm text-neutral-300 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.cta.href}
                scroll={tier.cta.href.startsWith("?") ? false : undefined}
                className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all ${tier.highlight ? "bg-white text-neutral-950 hover:bg-indigo-100" : "border border-white/10 text-white hover:bg-white/5"}`}
              >
                {tier.cta.label} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-white/5 px-6 py-24 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-12">Pricing FAQ</p>
        <div className="space-y-10">
          {[
            ["When does public pricing launch?", "Public pricing rolls out alongside Zerocast 1.0 in late 2026. Beta participants will be grandfathered into the lowest paid tier for 12 months as a thank-you."],
            ["Is there a free plan after launch?", "Yes. The Free tier will always exist, with a watermark on the output and limited monthly streaming hours."],
            ["Can I bring my own RTMP destination?", "Yes, on every paid tier including Beta. Push to any platform that accepts an RTMP URL + stream key — Facebook Live, LinkedIn Live, Trovo, Rumble, or a self-hosted server."],
            ["Are there limits on multistreaming destinations?", "Beta: unlimited. Free: 2 platforms simultaneous. Creator and Studio: all 4 native platforms + unlimited custom RTMP destinations."],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-8 last:border-0">
              <h3 className="font-bold text-white text-lg mb-3">{q}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
