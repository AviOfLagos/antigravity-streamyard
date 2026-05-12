import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComparisonTable, type ComparisonRow } from "@/components/seo/ComparisonTable";

export const metadata: Metadata = {
  title: "Riverside Alternative — Zerocast for Live Streaming (2026)",
  description:
    "Riverside excels at recording podcasts. Zerocast is built for live multistreaming with an AI Co-Host that answers chat in your voice. See the full comparison.",
  alternates: { canonical: "/compare/riverside-alternative" },
  openGraph: {
    title: "Zerocast vs Riverside — Live Streaming with AI",
    description: "Riverside records. Zerocast goes live with an AI Co-Host running your chat.",
    url: "/compare/riverside-alternative",
  },
};

const rows: ComparisonRow[] = [
  { feature: "Browser-based studio",         competitor: true,            zerocast: true },
  { feature: "Live streaming focus",         competitor: "Secondary",     zerocast: "Primary" },
  { feature: "Multistream to YT/Twitch/Kick",competitor: "Limited",       zerocast: true },
  { feature: "TikTok Live support",          competitor: false,           zerocast: true },
  { feature: "Custom RTMP destinations",     competitor: false,           zerocast: true },
  { feature: "Local-quality recording",      competitor: "4K, separate tracks", zerocast: "1080p cloud" },
  { feature: "AI Co-Host (chat replies)",    competitor: false,           zerocast: true },
  { feature: "Cross-platform chat aggregator",competitor: false,          zerocast: true },
  { feature: "Auto-scene switching",         competitor: false,           zerocast: true },
  { feature: "Post-production transcripts",  competitor: true,            zerocast: "Roadmap" },
  { feature: "Free tier",                    competitor: "2 hr/mo",       zerocast: "Beta: full access" },
  { feature: "Entry paid plan",              competitor: "$15/mo",        zerocast: "$24/mo (post-beta)" },
];

export default function RiversideAlternativePage() {
  return (
    <div className="text-white selection:bg-brand/30">
      <section className="px-6 pt-24 pb-12 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">Riverside Alternative</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-8"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>
          Riverside records podcasts.<br />
          <span className="text-ink-faint">Zerocast goes live.</span>
        </h1>
        <p className="text-ink-muted text-xl max-w-2xl leading-relaxed">
          Riverside built its reputation on local 4K recording for podcasters. If you stream live to YouTube, Twitch, Kick, or TikTok — and want an AI handling chat while you focus on the conversation — Zerocast is built for that job.
        </p>
      </section>

      <section className="px-6 pb-12 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Built for live, not edit-later",
            body: "Riverside's strength is post-production quality. Zerocast is engineered for the live moment — sub-second WebRTC plus multi-platform RTMP fan-out.",
          },
          {
            title: "Chat is a first-class citizen",
            body: "Riverside has no native live chat. Zerocast aggregates YouTube, Twitch, Kick, and TikTok chat — and the AI Co-Host responds in your voice while you stay on camera.",
          },
          {
            title: "Multistream out of the box",
            body: "Riverside streams to Twitter/X, LinkedIn, Facebook, and a single RTMP destination. Zerocast multistreams to YouTube + Twitch + Kick + TikTok simultaneously plus unlimited custom RTMP.",
          },
        ].map((card) => (
          <div key={card.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="font-bold text-white mb-3">{card.title}</p>
            <p className="text-ink-muted text-sm leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>

      <ComparisonTable competitorName="Riverside" rows={rows} />

      <section className="border-t border-white/5 px-6 py-24 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-12">Riverside Alternative FAQ</p>
        <div className="space-y-10">
          {[
            ["Should I use Zerocast or Riverside?", "Use Riverside if your output is an edited podcast or video and recording quality is everything. Use Zerocast if your output is a live broadcast where chat engagement matters as much as production value."],
            ["Can Zerocast record like Riverside?", "Yes — to the cloud at 1080p. Locally captured per-track recordings (Riverside's signature feature) are not yet supported; they're on the roadmap."],
            ["Does Zerocast support Magic Editor / AI transcripts?", "Not yet. Riverside has the edge on AI post-production. Zerocast's AI lives during the stream, not after it."],
            ["Can I do interviews with Zerocast?", "Yes. Up to 5 guests on stage + 1 host. Guests join from a browser link with device preview and an admit queue — same flow as Riverside."],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-8 last:border-0">
              <h3 className="font-bold text-white text-lg mb-3">{q}</h3>
              <p className="text-ink-muted text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5">
        <h2 className="font-black text-white text-4xl tracking-tight">Built for the live moment.</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all">
          Join the Beta <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
