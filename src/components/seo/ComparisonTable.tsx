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
      <td className={`px-4 py-5 text-center border-l border-white/5 text-xs ${highlight ? "bg-indigo-500/5 text-indigo-300" : "text-neutral-400"}`}>
        {val}
      </td>
    );
  }
  return (
    <td className={`px-4 py-5 text-center border-l border-white/5 ${highlight ? "bg-indigo-500/5" : ""}`}>
      {val
        ? <Check size={18} className={highlight ? "text-indigo-400 mx-auto" : "text-neutral-500 mx-auto"} />
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
            <th className="text-left pb-6 text-xs font-bold uppercase tracking-widest text-neutral-600 w-48">Feature</th>
            <th className="pb-6 text-center text-sm font-bold text-neutral-500">{competitorName}</th>
            <th className="pb-6 text-center text-sm font-bold text-indigo-400 bg-indigo-500/5 rounded-t-xl px-4">Zerocast ✦</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.feature} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
              <td className="py-5 text-sm font-medium text-neutral-300 pr-4">{row.feature}</td>
              <Cell val={row.competitor} />
              <Cell val={row.zerocast} highlight />
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-neutral-700 mt-6">
        ✦ AI features exclusive to Zerocast. Platform data represents publicly available information as of 2026.
      </p>
    </section>
  );
}
