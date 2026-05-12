import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComparisonTable, type ComparisonRow } from "@/components/seo/ComparisonTable";

export const metadata: Metadata = {
  title: "Streamlabs Alternative — Browser-Based Studio with AI (2026)",
  description:
    "Streamlabs Desktop is powerful but heavy. Zerocast is browser-based, multistreams to every platform, and ships with an AI Co-Host that runs chat in your voice.",
  alternates: { canonical: "/compare/streamlabs-alternative" },
  openGraph: {
    title: "Zerocast vs Streamlabs — Browser Studio with AI",
    description: "No downloads, no GPU drain. Browser-based streaming with built-in AI moderation.",
    url: "/compare/streamlabs-alternative",
  },
};

const rows: ComparisonRow[] = [
  { feature: "Runs in browser (no install)",  competitor: false,         zerocast: true },
  { feature: "GPU usage on host machine",     competitor: "High",        zerocast: "Minimal (cloud)" },
  { feature: "Multistream to 4 platforms",    competitor: "Prime: yes",  zerocast: true },
  { feature: "Custom RTMP destinations",      competitor: true,          zerocast: true },
  { feature: "Built-in alerts / widgets",     competitor: true,          zerocast: "Roadmap" },
  { feature: "Tip jar / donation tools",      competitor: true,          zerocast: "Roadmap" },
  { feature: "AI Co-Host (in-voice chat)",    competitor: false,         zerocast: true },
  { feature: "Cross-platform chat aggregator",competitor: "Limited",     zerocast: true },
  { feature: "Auto-scene switching",          competitor: "Manual",      zerocast: "AI-driven" },
  { feature: "Mac / Windows / Linux",         competitor: "Mac + Win",   zerocast: "Any browser" },
  { feature: "Free tier",                     competitor: "Yes (with watermark)", zerocast: "Beta: full access" },
  { feature: "Entry paid plan",               competitor: "$19/mo (Prime)", zerocast: "$24/mo (post-beta)" },
];

export default function StreamlabsAlternativePage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">
      <section className="px-6 pt-24 pb-12 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6">Streamlabs Alternative</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-8"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>
          Streamlabs runs hot.<br />
          <span className="text-neutral-600">Zerocast runs in your browser.</span>
        </h1>
        <p className="text-neutral-400 text-xl max-w-2xl leading-relaxed">
          Streamlabs Desktop is the OBS fork that bundled alerts and Prime multistreaming. It still demands a beefy GPU, a Windows or Mac install, and constant updates. Zerocast does the heavy lifting in the cloud — your laptop just sends one feed.
        </p>
      </section>

      <section className="px-6 pb-12 max-w-7xl mx-auto grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Your machine stops being the bottleneck",
            body: "Streamlabs encodes locally — fan-noise levels of CPU/GPU. Zerocast encodes in the cloud, so a Chromebook handles the same load a gaming rig used to.",
          },
          {
            title: "Switch from anywhere",
            body: "No install means you can go live from any browser, any OS — including iPad or Linux. Streamlabs Desktop is Mac/Windows only.",
          },
          {
            title: "AI replaces the second monitor",
            body: "Streamlabs alerts ping you when chat happens. Zerocast's AI Co-Host responds to chat in your voice while you focus on content.",
          },
        ].map((card) => (
          <div key={card.title} className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
            <p className="font-bold text-white mb-3">{card.title}</p>
            <p className="text-neutral-400 text-sm leading-relaxed">{card.body}</p>
          </div>
        ))}
      </section>

      <ComparisonTable competitorName="Streamlabs" rows={rows} />

      <section className="border-t border-white/5 px-6 py-24 max-w-4xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-12">Streamlabs Alternative FAQ</p>
        <div className="space-y-10">
          {[
            ["Can I use my Streamlabs alerts in Zerocast?", "Native widgets are on our roadmap. In the meantime, you can keep your Streamlabs browser-source alerts URL and add it as a custom overlay inside Zerocast's stage."],
            ["Does Zerocast support gaming streams?", "Yes. Share your screen or a specific window from the browser. For low-latency game capture (NVENC, etc.), use the External Encoder integration — push from OBS/Streamlabs into Zerocast as an RTMP source."],
            ["Is Zerocast as customizable as Streamlabs Desktop?", "Not for power users running complex scene graphs — that's still OBS/Streamlabs territory. Zerocast targets the 80% who want a clean studio that automates the production decisions."],
            ["Why is there no install?", "Browser-based means zero updates to manage and lower hardware requirements. WebRTC + cloud egress handle what local encoders used to do."],
          ].map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-8 last:border-0">
              <h3 className="font-bold text-white text-lg mb-3">{q}</h3>
              <p className="text-neutral-400 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 border-t border-white/5">
        <h2 className="font-black text-white text-4xl tracking-tight">Quit the install dance.</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-neutral-950 font-bold px-8 py-4 rounded-full text-sm hover:bg-indigo-100 transition-all">
          Join the Beta <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
