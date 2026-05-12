import { requireAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function csvEscape(v: string | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await prisma.betaRequest.findMany({
    orderBy: { createdAt: "desc" },
  });

  const header = ["createdAt", "name", "email", "platform", "painPoint"].join(",");
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString(),
      csvEscape(r.name),
      csvEscape(r.email),
      csvEscape(r.platform),
      csvEscape(r.painPoint),
    ].join(","),
  );

  const csv = [header, ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="beta-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
