import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "What is Multistreaming? — Definition, How It Works, ToS, Bandwidth",
  description:
    "Multistreaming means broadcasting one live stream to multiple platforms simultaneously — YouTube, Twitch, Kick, TikTok. Here's how it works, ToS rules, bandwidth math, and how to start.",
  alternates: { canonical: "/glossary/multistreaming" },
  openGraph: {
    title: "What is Multistreaming? Complete Guide for Creators",
    description: "Definition, how it works, platform ToS, bandwidth requirements, and tools.",
    url: "/glossary/multistreaming",
  },
};

const defJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTerm",
  name: "Multistreaming",
  description:
    "The practice of broadcasting a single live video stream to multiple streaming platforms simultaneously, such as YouTube Live, Twitch, Kick, and TikTok Live.",
  inDefinedTermSet: { "@type": "DefinedTermSet", name: "Zerocast Streaming Glossary" },
};

export default function MultistreamingGlossaryPage() {
  return (
    <div className="text-white selection:bg-brand/30">
      <Script
        id="def-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(defJsonLd) }}
      />

      <section className="px-6 pt-24 pb-12 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">Glossary</p>
        <h1 className="font-black text-white tracking-tight leading-[1.05] mb-8"
          style={{ fontSize: "clamp(40px, 6vw, 80px)" }}>
          What is multistreaming?
        </h1>
        <p className="text-ink-emphasis text-xl leading-relaxed mb-6">
          <strong>Multistreaming</strong> is the practice of broadcasting one live video stream to multiple platforms at the same time — for example, going live on YouTube, Twitch, Kick, and TikTok simultaneously from a single source.
        </p>
        <p className="text-ink-subtle text-base leading-relaxed">
          Also called <em>simulcasting</em>, multistreaming is how modern creators reach audiences without picking favorites between platforms. Instead of choosing whether to stream to Twitch&apos;s gaming community or YouTube&apos;s recommendation algorithm, you do both.
        </p>
      </section>

      <section className="px-6 py-16 max-w-4xl mx-auto prose prose-invert prose-headings:font-black">
        <h2 className="font-bold text-white text-3xl mb-6">How multistreaming works</h2>
        <p className="text-ink-muted leading-relaxed mb-6">
          A multistreaming service receives one RTMP (Real-Time Messaging Protocol) feed from your browser, computer, or hardware encoder. It then transcodes that feed (if needed) and republishes it to multiple destination platforms in parallel using each platform&apos;s RTMP ingest URL and stream key.
        </p>
        <p className="text-ink-muted leading-relaxed mb-12">
          The cloud-based model is critical: your local upload bandwidth only needs to support <em>one</em> outgoing stream regardless of how many destinations receive it. Without cloud fan-out, multistreaming to four platforms would require 4× the upload speed.
        </p>

        <h2 className="font-bold text-white text-3xl mb-6">Is multistreaming against ToS?</h2>
        <p className="text-ink-muted leading-relaxed mb-4"><strong className="text-white">YouTube Live:</strong> Allowed for all creators.</p>
        <p className="text-ink-muted leading-relaxed mb-4"><strong className="text-white">Twitch:</strong> Removed its exclusivity clause for non-Partners in 2022. Most Partners can now multistream as well, with some restrictions on simulcasting to other tier-1 platforms.</p>
        <p className="text-ink-muted leading-relaxed mb-4"><strong className="text-white">Kick:</strong> No restrictions on multistreaming.</p>
        <p className="text-ink-muted leading-relaxed mb-12"><strong className="text-white">TikTok Live:</strong> Allowed as long as you have a single TikTok account broadcasting. Multi-account simulcasting on TikTok is prohibited.</p>

        <h2 className="font-bold text-white text-3xl mb-6">Bandwidth requirements</h2>
        <ul className="text-ink-muted leading-relaxed space-y-3 mb-12">
          <li><strong className="text-white">720p @ 30fps:</strong> 3-5 Mbps upload recommended.</li>
          <li><strong className="text-white">1080p @ 30fps:</strong> 5-8 Mbps upload recommended.</li>
          <li><strong className="text-white">1080p @ 60fps:</strong> 8-10 Mbps upload recommended.</li>
          <li><strong className="text-white">4K @ 60fps:</strong> 25 Mbps+ upload. Note: most destination platforms cap incoming bitrate well below this.</li>
        </ul>

        <h2 className="font-bold text-white text-3xl mb-6">Common multistreaming tools</h2>
        <p className="text-ink-muted leading-relaxed mb-4">
          <strong className="text-white">Restream</strong> pioneered the category. Strong on platform breadth (30+ destinations).
        </p>
        <p className="text-ink-muted leading-relaxed mb-4">
          <strong className="text-white">StreamYard</strong> bundles multistreaming with an in-browser interview studio.
        </p>
        <p className="text-ink-muted leading-relaxed mb-4">
          <strong className="text-white">Streamlabs (Prime)</strong> adds multistreaming on top of its desktop encoder.
        </p>
        <p className="text-ink-muted leading-relaxed mb-12">
          <strong className="text-white">Zerocast</strong> — multistream + browser studio + AI Co-Host that handles chat across all platforms in your voice.
        </p>

        <h2 className="font-bold text-white text-3xl mb-6">Pros and cons</h2>
        <p className="text-ink-muted leading-relaxed mb-4">
          <strong className="text-white">Pros:</strong> Reach audiences on multiple platforms without duplicating effort. Diversify against algorithm changes or platform bans. Capture audiences each platform serves differently.
        </p>
        <p className="text-ink-muted leading-relaxed mb-8">
          <strong className="text-white">Cons:</strong> Chat is split across platforms (requires aggregation). Each platform&apos;s analytics are siloed. Monetization features (Subscribe button placement, Twitch Bits) may not display optimally across all destinations.
        </p>
      </section>

      <section className="border-t border-white/5 px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <h2 className="font-black text-white text-4xl tracking-tight">Multistream with an AI on chat.</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all">
          Try Zerocast Beta <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
