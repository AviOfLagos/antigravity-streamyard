import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Zerocast vs StreamYard vs Restream | 2026 Comparison",
  description: "See how Zerocast's AI automation stacks up against StreamYard, Restream, and MelonApp.",
};

const rows = [
  { feature: "Browser Studio",         sy: true,  rs: true,  ma: true,  zc: true  },
  { feature: "Multistreaming",          sy: true,  rs: true,  ma: true,  zc: true  },
  { feature: "30+ Platforms",           sy: false, rs: true,  ma: false, zc: false },
  { feature: "Guest Joining",           sy: true,  rs: true,  ma: true,  zc: true  },
  { feature: "AI Chat Moderation",      sy: false, rs: false, ma: false, zc: true  },
  { feature: "AI Co-Host Persona",      sy: false, rs: false, ma: false, zc: true  },
  { feature: "Auto-Scene Switching",    sy: false, rs: false, ma: false, zc: true  },
  { feature: "Voice-Clone Replies",     sy: false, rs: false, ma: false, zc: true  },
  { feature: "Unified Chat Dashboard",  sy: false, rs: true,  ma: false, zc: true  },
];

function Cell({ val, highlight }: { val: boolean; highlight?: boolean }) {
  return (
    <td className={`px-4 py-5 text-center border-l border-white/5 ${highlight ? "bg-indigo-500/5" : ""}`}>
      {val
        ? <Check size={18} className={highlight ? "text-indigo-400 mx-auto" : "text-neutral-500 mx-auto"} />
        : <Minus size={18} className="text-white/10 mx-auto" />}
    </td>
  );
}

export default function ComparePage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">

      {/* Hero */}
      <section className="px-6 pt-24 pb-20 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-8">Compare</p>
        <h1 className="font-black text-white tracking-tight leading-[0.9] mb-10"
          style={{ fontSize: "clamp(48px, 8vw, 104px)" }}>
          The smart<br />alternative.
        </h1>
        <p className="text-neutral-400 text-xl max-w-xl leading-relaxed">
          StreamYard is great for starting out. Restream is great for reach. Zerocast is for creators who want AI to handle the production so they can focus on content.
        </p>
      </section>

      {/* Comparison table */}
      <section className="px-6 pb-24 max-w-7xl mx-auto overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left pb-6 text-xs font-bold uppercase tracking-widest text-neutral-600 w-48">Feature</th>
              <th className="pb-6 text-center text-sm font-bold text-neutral-500">StreamYard</th>
              <th className="pb-6 text-center text-sm font-bold text-neutral-500">Restream</th>
              <th className="pb-6 text-center text-sm font-bold text-neutral-500">MelonApp</th>
              <th className="pb-6 text-center text-sm font-bold text-indigo-400 bg-indigo-500/5 rounded-t-xl px-4">Zerocast ✦</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="py-5 text-sm font-medium text-neutral-300 pr-4">{row.feature}</td>
                <Cell val={row.sy} />
                <Cell val={row.rs} />
                <Cell val={row.ma} />
                <Cell val={row.zc} highlight />
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-700 mt-6">✦ AI features exclusive to Zerocast. Platform data represents publicly available information as of 2026.</p>
      </section>

      {/* Positioning statement */}
      <section className="border-t border-white/5 px-6 py-24 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-0">
          {[
            ["Choose StreamYard if…", "You value ease-of-use above all and are just starting out with browser-based streaming for interviews or webinars."],
            ["Choose Restream if…", "Your primary goal is reaching the maximum number of platforms and you need deep cross-platform analytics."],
            ["Choose Zerocast if…", "You want an AI production team that learns your style, automates your chat, and scales your engagement without scaling your workload."],
          ].map(([heading, desc], i) => (
            <div key={heading} className={`py-10 ${i > 0 ? "border-l border-white/5 pl-10" : "pr-10"}`}>
              <p className={`font-bold text-lg mb-3 ${i === 2 ? "text-indigo-300" : "text-neutral-400"}`}>{heading}</p>
              <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        <h2 className="font-black text-white text-4xl tracking-tight">Ready to make the switch?</h2>
        <Link href="?beta=true" scroll={false} className="shrink-0 inline-flex items-center gap-2 bg-white text-neutral-950 font-bold px-8 py-4 rounded-full text-sm hover:bg-indigo-100 transition-all">
          Join the Beta <ArrowRight size={16} />
        </Link>
      </section>

    </div>
  );
}
