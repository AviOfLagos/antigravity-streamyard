import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Zerocast",
  description: "Terms of Service for Zerocast.",
};

export default function TermsPage() {
  const sections = [
    {
      title: "Description of Service",
      body: "Zerocast provides a browser-based live streaming studio and AI co-hosting tools that allow you to broadcast to third-party platforms via RTMP. The service is currently in private beta.",
    },
    {
      title: "User Conduct & Content",
      body: "You are entirely responsible for your broadcast content. You agree not to broadcast content that is illegal, threatening, defamatory, or that infringes any third-party intellectual property rights. You also agree to comply with the terms of all connected platforms (YouTube, Twitch, etc.).",
    },
    {
      title: "Third-Party Services",
      body: "Zerocast integrates with third-party platforms. Your use of those services is governed by their respective terms and policies. We are not responsible for any suspension or banning of accounts on third-party platforms.",
    },
    {
      title: "Beta Program",
      body: "Zerocast is currently in private beta. The service is provided \"as is\" and \"as available\". We may change, suspend, or discontinue any aspect of the service at any time without notice.",
    },
    {
      title: "Limitation of Liability",
      body: "To the maximum extent permitted by law, Zerocast shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the service.",
    },
    {
      title: "Termination",
      body: "We may terminate or suspend access to our service immediately, without prior notice, for any breach of these terms. Upon termination, your right to use the service will immediately cease.",
    },
  ];

  return (
    <div className="text-white selection:bg-brand/30">

      <section className="px-6 pt-24 pb-16 max-w-7xl mx-auto border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Legal</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-4"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
          Terms of Service
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
