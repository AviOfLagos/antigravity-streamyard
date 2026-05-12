import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComparisonTable, type ComparisonRow } from "@/components/seo/ComparisonTable";

export const metadata: Metadata = {
  title: "Restream Alternative — Zerocast vs Restream (2026)",
  description:
    "Looking for a Restream alternative? Zerocast multistreams to YouTube, Twitch, Kick, and TikTok with a built-in AI Co-Host that replies in your voice — features Restream lacks.",
  alternates: { canonical: "/compare/restream-alternative" },
  openGraph: {
    title: "Zerocast — The Restream Alternative with an AI Co-Host",
    description:
      "Browser-based multistreaming + AI Co-Host that moderates chat in your voice. No downloads, no second monitor.",
    url: "/compare/restream-alternative",
  },
};

const rows: ComparisonRow[] = [
  { feature: "Browser-based studio",          competitor: true,                 zerocast: true },
  { feature: "Multistream to 4+ platforms",   competitor: true,                 zerocast: true },
  { feature: "Custom RTMP destinations",      competitor: true,                 zerocast: true },
  { feature: "Cross-platform chat aggregator",competitor: true,                 zerocast: true },
  { feature: "Send chat to YouTube + Twitch", competitor: "Read only",          zerocast: "Read + Reply" },
  { feature: "AI Co-Host (in-voice replies)", competitor: false,                zerocast: true },
  { feature: "AI auto-moderation",            competitor: "Captions only",      zerocast: "Context-aware" },
  { feature: "Auto-scene switching",          competitor: false,                zerocast: true },
  { feature: "Voice/persona Tone Matching",   competitor: false,                zerocast: true },
  { feature: "Free tier",                     competitor: "2 platforms, watermark", zerocast: "Beta: full access" },
  { feature: "Entry paid plan",               competitor: "$19/mo",             zerocast: "$24/mo (post-beta)" },
  { feature: "Pre-recorded video streaming",  competitor: true,                 zerocast: false },
];

export default function RestreamAlternativePage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">
      <section className="px-6 pt-24 pb-12 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Restream Alternative</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-8"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>
          Restream gets you to<br />every platform.<br />
          <span className="text-neutral-600">Zerocast also runs the show.</span>
        </h1>
        <p className="text-neutral-400 text-xl max-w-2xl leading-relaxed">
          Restream solved multistreaming. It still treats live chat as something you scroll past. Zerocast makes the AI a real co-host — it answers viewers in your voice, surfaces super-chats, and switches scenes on its own.
        </p>
      </section>

      <section className="px-6 pb-12 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Chat is two-way, not just unified",
            body: "Restream Chat aggregates messages so you can read them. Zerocast replies to them — in your tone, learned from your past chat logs — while you stay on camera.",
          },
          {
            title: "Production runs itself",
            body: "When a guest speaks or you share a screen, Zerocast switches the layout automatically. Restream still expects you (or a producer) to drive the scene.",
          },
          {
            title: "No second monitor required",
            body: "Restream's strength is breadth (30+ destinations, pre-recorded streams). Zerocast's strength is automation depth on the four platforms where most viewers actually live.",
          },
        ].map((card) => (
          <div key={card.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="font-bold text-white mb-3">{card.title}</p>
            <p className="text-neutral-400 text-sm leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>

      <ComparisonTable competitorName="Restream" rows={rows} />

      <section className="border-t border-white/5 px-6 py-24 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-12">Restream Alternative FAQ</p>
        <div className="space-y-10">
          {[
            ["Is Zerocast a direct Restream replacement?", "For 90% of Restream users, yes. If you specifically need to broadcast to 30+ niche RTMP platforms or schedule pre-recorded videos as 'live' streams, stay with Restream. Everyone else gets a more capable studio with AI built in."],
            ["Can I import my Restream destinations?", "Yes. Both products use stream keys + ingest URLs. Copy them from your Restream channel settings into Zerocast → Settings → Platforms once during onboarding."],
            ["Does Zerocast support pre-recorded streams?", "Not yet. That's a roadmap item. For now, Zerocast is purely live."],
            ["How does pricing compare?", "Beta access is free. Public Creator pricing is $24/mo (annual) vs Restream's Standard at $19/mo. Zerocast bundles the AI Co-Host where Restream does not include comparable automation at any tier."],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-8 last:border-0">
              <h3 className="font-bold text-white text-lg mb-3">{q}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5">
        <h2 className="font-black text-white text-4xl tracking-tight">Try the smarter studio.</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-neutral-950 font-bold px-8 py-4 rounded-full text-sm hover:bg-indigo-100 transition-all">
          Join the Beta <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
