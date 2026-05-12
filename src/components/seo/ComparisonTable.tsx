import { Check, Minus } from "lucide-react";

export interface ComparisonRow {
  feature: string;
  competitor: boolean | string;
  zerocast: boolean | string;
}

interface Props {
  competitorName: string;
  rows: ComparisonRow[];
}

function Cell({ val, highlight }: { val: boolean | string; highlight?: boolean }) {
  if (typeof val === "string") {
    return (
      <td className={`px-4 py-5 text-center border-l border-white/5 text-xs ${highlight ? "bg-brand/5 text-brand-softer" : "text-ink-muted"}`}>
        {val}
      </td>
    );
  }
  return (
    <td className={`px-4 py-5 text-center border-l border-white/5 ${highlight ? "bg-brand/5" : ""}`}>
      {val
        ? <Check size={18} className={highlight ? "text-brand-soft mx-auto" : "text-ink-subtle mx-auto"} />
        : <Minus size={18} className="text-white/10 mx-auto" />}
    </td>
  );
}

export function ComparisonTable({ competitorName, rows }: Props) {
  return (
    <section className="px-6 pb-24 max-w-7xl mx-auto overflow-x-auto">
      <table className="w-full min-w-[600px] border-collapse">
        <thead>
          <tr className="border-b border-white/5">
            <th className="text-left pb-6 text-xs font-bold uppercase tracking-widest text-ink-faint w-48">Feature</th>
            <th className="pb-6 text-center text-sm font-bold text-ink-subtle">{competitorName}</th>
            <th className="pb-6 text-center text-sm font-bold text-brand-soft bg-brand/5 rounded-t-xl px-4">Zerocast ✦</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-5 text-sm font-medium text-ink-emphasis pr-4">{row.feature}</td>
              <Cell val={row.competitor} />
              <Cell val={row.zerocast} highlight />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-ink-fainter mt-6">
        ✦ AI features exclusive to Zerocast. Platform data represents publicly available information as of 2026.
      </p>
    </section>
  );
}
