import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Zerocast",
  description: "Get in touch with the Zerocast team.",
};

export default function ContactPage() {
  return (
    <div className="text-white selection:bg-brand/30">

      <section className="px-6 pt-24 pb-20 max-w-7xl mx-auto border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-8">Contact</p>
        <h1 className="font-black text-white tracking-tight leading-[0.9]"
          style={{ fontSize: "clamp(52px, 9vw, 120px)" }}>
          Get in<br />touch.
        </h1>
      </section>

      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="space-y-0">
          {[
            {
              type: "General Inquiries",
              value: "avi@nexprove.com",
              href: "mailto:avi@nexprove.com",
              desc: "Partnerships, press, and general questions.",
            },
            {
              type: "Design",
              value: "avi@nexprove.com",
              href: "mailto:avi@nexprove.com",
              desc: "UI/UX contributions and visual identity.",
            },
            {
              type: "Beta Support",
              value: "GitHub Discussions",
              href: "https://github.com/AviOfLagos/zerocast/discussions",
              desc: "Bug reports, feature requests, and beta feedback.",
            },
          ].map((item, i) => (
            <a
              key={item.type}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noreferrer" : undefined}
              className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-10 border-t border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-start gap-8">
                <span className="text-xs font-black text-ink-fainter tabular-nums mt-1 shrink-0">0{i + 1}</span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-ink-faint mb-1">{item.type}</p>
                  <p className="font-bold text-white text-xl group-hover:text-brand-softer transition-colors">{item.value}</p>
                  <p className="text-ink-subtle text-sm mt-1">{item.desc}</p>
                </div>
              </div>
              <span className="text-ink-fainter group-hover:text-brand-soft transition-colors text-xl">→</span>
            </a>
          ))}
        </div>
      </section>

    </div>
  );
}
