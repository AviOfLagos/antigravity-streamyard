import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Zerocast",
  description: "Privacy policy for Zerocast, the AI-powered live streaming studio.",
};

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      body: "We collect information you provide directly when you create an account, connect streaming platforms (YouTube, Twitch, Kick, TikTok), or submit beta feedback. This includes your name, email, OAuth tokens, and any custom AI persona instructions you provide.",
    },
    {
      title: "How We Use Your Data",
      body: "We use collected data to provide and improve the Zerocast studio, enable the AI Co-Host to function with your specified tone, route streams via RTMP to your connected platforms, and analyse usage trends. We do not sell your data to third parties.",
    },
    {
      title: "AI Processing",
      body: "Chat context and persona instructions are processed by LLM providers to power the AI Co-Host. We do not use your personal streaming content to train our internal models without explicit consent. All AI prompts are sanitized before processing.",
    },
    {
      title: "Data Security",
      body: "OAuth tokens are encrypted at rest. We do not permanently store video or audio streams — they are processed in real-time via our WebRTC infrastructure. We use industry-standard TLS for data in transit.",
    },
    {
      title: "Your Rights",
      body: "You may request deletion of your account and all associated data at any time by contacting avi@nexprove.com. We will process deletion requests within 30 days.",
    },
    {
      title: "Contact",
      body: "Questions about this policy? Email avi@nexprove.com.",
    },
  ];

  return (
    <div className="text-white selection:bg-brand/30">

      <section className="px-6 pt-24 pb-16 max-w-7xl mx-auto border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Legal</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-4"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
          Privacy Policy
        </h1>
        <p className="text-ink-subtle text-sm">Last updated: May 2026</p>
      </section>

      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="max-w-3xl space-y-0">
          {sections.map((s, i) => (
            <div key={s.title} className="flex gap-8 py-10 border-t border-white/5">
              <span className="text-xs font-black text-ink-fainter tabular-nums mt-1 shrink-0 w-6">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-bold text-white text-lg mb-3">{s.title}</p>
                <p className="text-ink-subtle text-sm leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
