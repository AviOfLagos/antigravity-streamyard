import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PlatformIcon from "@/components/ui/PlatformIcon";

export const metadata: Metadata = {
  title: "Integrations | Zerocast — Stream Everywhere",
  description: "Zerocast streams to YouTube, Twitch, Kick, TikTok, and any custom RTMP destination simultaneously.",
};

const platforms = [
  {
    key: "youtube",
    name: "YouTube Live",
    color: "text-danger-text",
    detail: "Full broadcast API, title/description sync, superchat integration."
  },
  {
    key: "twitch",
    name: "Twitch",
    color: "text-accent-purple",
    detail: "Native Twitch chat aggregation, clip triggers, channel point events."
  },
  {
    key: "kick",
    name: "Kick",
    color: "text-success-text",
    detail: "Direct RTMP routing, chat relay, and subscription events."
  },
  {
    key: "tiktok",
    name: "TikTok Live",
    color: "text-ink-emphasis",
    detail: "Real-time RTMP broadcast with unified chat from TikTok gifting."
  },
];

export default function IntegrationsPage() {
  return (
    <div className="text-white selection:bg-brand/30">

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Integrations</p>
        <h1 className="font-black text-white tracking-tight leading-[0.9] mb-12"
          style={{ fontSize: "clamp(52px, 9vw, 120px)" }}>
          Stream everywhere.<br />
          <span className="text-ink-faint">Reach everyone.</span>
        </h1>
        <p className="text-ink-muted text-xl max-w-xl leading-relaxed border-l-2 border-white/10 pl-6">
          Zerocast&apos;s cloud routing engine broadcasts to up to 8 destinations simultaneously in 1080p — without using a single extra watt of your CPU.
        </p>
      </section>

      {/* Platform rows */}
      <section className="border-t border-white/5 px-6 py-24 bg-surface-1/40">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-16">Supported platforms</p>
          <div className="space-y-0">
            {platforms.map((p, i) => (
              <div key={p.key} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-8 border-t border-white/5">
                <div className="flex items-center gap-6">
                  <span className="text-xs font-black text-ink-fainter tabular-nums shrink-0">0{i + 1}</span>
                  <PlatformIcon platform={p.key} size={28} />
                  <p className={`font-bold text-xl ${p.color}`}>{p.name}</p>
                </div>
                <p className="text-ink-subtle text-sm max-w-sm sm:text-right leading-relaxed">{p.detail}</p>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 py-8 border-t border-white/5">
              <div className="flex items-center gap-6">
                <span className="text-xs font-black text-ink-fainter tabular-nums shrink-0">05+</span>
                <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-ink-muted font-bold text-xs">R</div>
                <p className="font-bold text-xl text-ink-muted">Custom RTMP</p>
              </div>
              <p className="text-ink-subtle text-sm max-w-sm sm:text-right leading-relaxed">Facebook, LinkedIn, X, Vimeo, your own server — any RTMP destination works.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Ways to go live */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-16">Ways to go live</p>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="pr-12 border-r border-white/5">
            <p className="font-black text-white text-3xl mb-4">Zerocast Browser Studio</p>
            <p className="text-ink-subtle text-sm leading-relaxed mb-6">
              Our all-in-one browser-based studio. Invite guests, share your screen, and let the AI manage layout and chat automatically. Zero software required.
            </p>
            <Link href="?beta=true" scroll={false} className="inline-flex items-center gap-2 text-brand-soft hover:text-brand-softer text-sm font-medium transition-colors">
              Start free <ArrowRight size={14} />
            </Link>
          </div>
          <div className="pl-12">
            <p className="font-black text-white text-3xl mb-4">External Encoder (OBS / vMix)</p>
            <p className="text-ink-subtle text-sm leading-relaxed mb-6">
              Already have a complex OBS setup? Use Zerocast as your cloud router. Send one stream to us via RTMP and we&apos;ll fan it out to every platform while aggregating chat.
            </p>
            <p className="text-ink-faint text-sm">Available in Pro tier</p>
          </div>
        </div>
      </section>

      {/* Unified chat highlight */}
      <section className="border-t border-white/5 px-6 py-20 bg-surface-1/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-4">Unified Chat</p>
            <h2 className="font-black text-white text-4xl tracking-tight mb-4">One panel. Every platform.</h2>
            <p className="text-ink-subtle text-sm max-w-md leading-relaxed">
              Messages from YouTube, Twitch, Kick, and TikTok are aggregated into a single, ranked, clean chat dashboard. No more juggling browser tabs.
            </p>
          </div>
          <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all">
            Try It Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
