import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BetaRequestsAdmin() {
  // Auth handled by /admin/layout.tsx via requireAdmin().
  const rows = await prisma.betaRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const total = rows.length;
  const platformCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.platform] = (acc[r.platform] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="text-white">
      <section className="px-6 pt-16 pb-8 max-w-7xl mx-auto">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
          Admin · Beta Requests
        </p>
        <h1 className="font-black text-white tracking-tight leading-[1.05] mb-6"
          style={{ fontSize: "clamp(40px, 6vw, 72px)" }}>
          {total} {total === 1 ? "request" : "requests"}
        </h1>
        <div className="flex flex-wrap gap-3 mb-12">
          {Object.entries(platformCounts).map(([platform, count]) => (
            <span
              key={platform}
              className="inline-flex items-center gap-2 text-sm border border-white/10 rounded-full px-4 py-1.5 bg-white/[0.03]"
            >
              <span className="text-ink-emphasis font-medium">{platform}</span>
              <span className="text-ink-subtle text-xs font-mono">{count}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24 max-w-7xl mx-auto">
        {rows.length === 0 ? (
          <p className="text-ink-subtle text-sm">No requests yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-ink-subtle">
                  <th className="text-left py-4 pr-6">When</th>
                  <th className="text-left py-4 pr-6">Name</th>
                  <th className="text-left py-4 pr-6">Email</th>
                  <th className="text-left py-4 pr-6">Platform</th>
                  <th className="text-left py-4">Pain point</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pr-6 text-xs text-ink-subtle font-mono whitespace-nowrap">
                      {r.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="py-4 pr-6 text-sm text-white font-medium">{r.name}</td>
                    <td className="py-4 pr-6 text-sm">
                      <a
                        href={`mailto:${r.email}`}
                        className="text-brand-soft hover:text-brand-softer underline underline-offset-2"
                      >
                        {r.email}
                      </a>
                    </td>
                    <td className="py-4 pr-6 text-sm text-ink-emphasis">{r.platform}</td>
                    <td className="py-4 text-sm text-ink-muted max-w-md">{r.painPoint || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center gap-6 text-xs text-ink-faint">
          <a
            href="/api/admin/beta-requests.csv"
            className="text-brand-soft hover:text-brand-softer underline underline-offset-2"
          >
            Download CSV
          </a>
        </div>
      </section>
    </div>
  );
}
