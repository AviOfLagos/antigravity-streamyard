import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, Mic, MonitorPlay, MessagesSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Co-Host | Zerocast — Your Automated Production Assistant",
  description: "Meet the AI that learns your voice, manages your chat, and handles scene production automatically.",
};

export default function AiCoHostPage() {
  return (
    <div className="text-white selection:bg-brand/30">

      {/* Hero */}
      <section className="relative px-6 pt-24 pb-20 max-w-7xl mx-auto overflow-hidden">
        <div className="absolute inset-0 -z-10 brand-glow-section" />
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-soft border border-brand/20 rounded-full px-4 py-1.5 mb-12">
          <Bot size={14} /> Zerocast AI Engine
        </div>
        <h1 className="font-black text-white tracking-tight leading-[1] mb-12"
          style={{ fontSize: "clamp(48px, 8vw, 110px)" }}>
          Don&apos;t just stream.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-soft to-accent-purple">
            Co-host with AI.
          </span>
        </h1>
        <div className="flex items-center gap-8 border-t border-white/5 pt-10">
          <p className="text-ink-muted text-lg max-w-md leading-relaxed">
            The first AI assistant that lives in your browser, knows your stream, and engages your audience the way you would — at machine speed.
          </p>
          <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-7 py-3.5 rounded-full text-sm hover:bg-brand-on-light transition-all">
            Train Your AI <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Feature rows */}
      <section className="border-t border-white/5 px-6 py-24 bg-surface-1/40">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-16">Core capabilities</p>
          <div className="space-y-0">
            {[
              {
                icon: <Mic size={24} className="text-brand-soft" />,
                title: "Tone & Writing Style Matching",
                desc: "Feed in your past chat logs or write a persona brief. The AI learns your specific sense of humor, moderation style, and catchphrases — and uses them to engage your audience authentically in chat.",
              },
              {
                icon: <MonitorPlay size={24} className="text-accent-purple" />,
                title: "Auto-Scene Switching",
                desc: "No more juggling hotkeys mid-interview. The AI detects when a guest starts speaking, when you share your screen, or when energy drops — and switches layout automatically.",
              },
              {
                icon: <MessagesSquare size={24} className="text-accent-blue" />,
                title: "Smart Chat Moderation",
                desc: "Forget word filters. The AI understands context. It bans trolls, highlights relevant questions, pins useful links, and reads out superchats — all based on your live conversation topic.",
              },
            ].map((feat, i) => (
              <div key={feat.title} className="flex flex-col md:flex-row gap-8 py-12 border-t border-white/5">
                <div className="md:w-64 shrink-0">
                  <div className="flex items-center gap-3 mb-2">
                    {feat.icon}
                    <span className="text-xs font-black text-ink-fainter tabular-nums">0{i + 1}</span>
                  </div>
                  <p className="font-bold text-white text-xl">{feat.title}</p>
                </div>
                <p className="text-ink-subtle text-base leading-relaxed max-w-2xl">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Multichat Problem */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-16 items-start">
          <div className="md:col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-accent-purple mb-6">The Multichat Problem</p>
            <h2 className="font-black text-white tracking-tight leading-[1.05] mb-6"
              style={{ fontSize: "clamp(32px, 3.5vw, 48px)" }}>
              Never miss a superchat again.
            </h2>
            <p className="text-ink-subtle text-sm leading-relaxed">
              When you&apos;re live on 4 platforms, chat moves at 300 messages per minute. The AI Co-Host filters the signal from the noise and pushes only high-value interactions to your view.
            </p>
          </div>
          <div className="md:col-span-3 space-y-0">
            {[
              "Automatically highlights questions worth answering",
              "Bans repetitive spam patterns across all platforms simultaneously",
              "Replies to common FAQs using your pre-defined answers",
              "Reads out and acknowledges superchats contextually",
              "Pins useful links shared in chat for your audience to see",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 py-5 border-t border-white/5">
                <span className="w-5 h-5 rounded-full bg-brand/20 text-brand-soft text-xs flex items-center justify-center font-bold shrink-0">✓</span>
                <p className="text-ink-emphasis text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-20 bg-surface-1/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-black text-white text-4xl tracking-tight">Your AI Co-Host is waiting.</h2>
          <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-ink-inverse font-bold px-8 py-4 rounded-full text-sm hover:bg-brand-on-light transition-all">
            Join the Beta <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
