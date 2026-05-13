import { AlertTriangle, Server, MonitorSmartphone } from "lucide-react"

import { getRecentErrors, type ErrorRecord } from "@/lib/errors"

export const dynamic = "force-dynamic"

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return `${s}s ago`
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

function groupByMessage(errors: ErrorRecord[]) {
  const map = new Map<
    string,
    { count: number; last: ErrorRecord; sides: Set<ErrorRecord["side"]> }
  >()
  for (const e of errors) {
    const existing = map.get(e.message)
    if (existing) {
      existing.count++
      existing.sides.add(e.side)
      if (e.ts > existing.last.ts) existing.last = e
    } else {
      map.set(e.message, { count: 1, last: e, sides: new Set([e.side]) })
    }
  }
  return [...map.entries()]
    .map(([message, v]) => ({
      message,
      count: v.count,
      last: v.last,
      sides: [...v.sides],
    }))
    .sort((a, b) => b.count - a.count || b.last.ts - a.last.ts)
}

export default async function AdminErrorsPage() {
  const errors = await getRecentErrors(200)
  const grouped = groupByMessage(errors)
  const clientCount = errors.filter((e) => e.side === "client").length
  const serverCount = errors.filter((e) => e.side === "server").length
  const last = errors[0]

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 text-white">
      <p className="text-xs font-bold uppercase tracking-widest text-brand-soft mb-6">
        Admin · Errors
      </p>
      <h1
        className="font-black tracking-tight leading-[1.05] mb-4"
        style={{ fontSize: "clamp(36px, 5vw, 64px)" }}
      >
        {errors.length} {errors.length === 1 ? "error" : "errors"}
      </h1>
      <p className="text-ink-muted max-w-2xl mb-12">
        Last 200 captured errors from <code className="text-brand-soft font-mono text-sm">errors:recent</code>.
        Client-side errors come from the <code className="text-brand-soft font-mono text-sm">ErrorBeacon</code> mounted in
        the root layout. Server errors come from{" "}
        <code className="text-brand-soft font-mono text-sm">instrumentation.ts</code> (Next.js{" "}
        <code className="text-brand-soft font-mono text-sm">onRequestError</code>).
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <Stat
          icon={<MonitorSmartphone size={16} />}
          label="Client errors"
          value={clientCount}
        />
        <Stat
          icon={<Server size={16} />}
          label="Server errors"
          value={serverCount}
        />
        <Stat
          icon={<AlertTriangle size={16} />}
          label="Unique messages"
          value={grouped.length}
        />
        <Stat
          icon={<AlertTriangle size={16} />}
          label="Latest"
          value={last ? timeAgo(last.ts) : "—"}
          mono={false}
        />
      </div>

      <section className="mb-16">
        <h2 className="text-lg font-bold mb-4">Top messages</h2>
        {grouped.length === 0 ? (
          <p className="text-ink-subtle text-sm">
            No errors captured yet. Trigger one in dev:{" "}
            <code className="text-brand-soft">throw new Error(&quot;test&quot;)</code>.
          </p>
        ) : (
          <div className="rounded-xl border border-white/8 bg-surface-1/40 overflow-hidden">
            {grouped.slice(0, 10).map((g) => (
              <div
                key={g.message}
                className="px-5 py-4 border-b border-white/5 last:border-0 flex items-start gap-4"
              >
                <div className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-danger/10 border border-danger/30 text-danger-soft font-mono text-sm">
                  {g.count}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-mono break-all">
                    {g.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-faint">
                    <span>{timeAgo(g.last.ts)}</span>
                    <span>·</span>
                    <span>{g.sides.join(" + ")}</span>
                    {g.last.url ? (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-md font-mono">
                          {g.last.url}
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4">Recent feed</h2>
        {errors.length === 0 ? (
          <p className="text-ink-subtle text-sm">Quiet.</p>
        ) : (
          <div className="space-y-3">
            {errors.slice(0, 40).map((e, i) => (
              <details
                key={`${e.ts}-${i}`}
                className="rounded-lg border border-white/8 bg-surface-1/40 px-4 py-3 group"
              >
                <summary className="flex items-center gap-3 cursor-pointer list-none">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                      e.side === "server"
                        ? "bg-warn/10 text-warn-text border border-warn/30"
                        : "bg-brand/10 text-brand-soft border border-brand/30"
                    }`}
                  >
                    {e.side}
                  </span>
                  <span className="text-xs font-mono text-ink-faint shrink-0">
                    {timeAgo(e.ts)}
                  </span>
                  <span className="text-sm text-white truncate flex-1 font-mono">
                    {e.message}
                  </span>
                </summary>
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2 text-xs">
                  {e.url ? (
                    <KV k="URL" v={e.url} />
                  ) : null}
                  {e.email ? <KV k="User" v={e.email} /> : null}
                  {e.userAgent ? (
                    <KV k="UA" v={e.userAgent} truncate />
                  ) : null}
                  {e.context ? (
                    <KV k="Context" v={JSON.stringify(e.context)} />
                  ) : null}
                  {e.stack ? (
                    <pre className="mt-2 p-3 rounded bg-surface-2 border border-white/8 text-[11px] font-mono text-ink-emphasis overflow-x-auto whitespace-pre-wrap">
                      {e.stack}
                    </pre>
                  ) : null}
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  mono = true,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  mono?: boolean
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-surface-1/40 p-4">
      <div className="flex items-center gap-2 text-ink-muted mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-widest font-bold">
          {label}
        </span>
      </div>
      <div
        className={`text-3xl font-black tracking-tight ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  )
}

function KV({ k, v, truncate }: { k: string; v: string; truncate?: boolean }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-ink-faint w-16 shrink-0">
        {k}
      </span>
      <span
        className={`font-mono text-ink-emphasis ${
          truncate ? "truncate" : "break-all"
        }`}
      >
        {v}
      </span>
    </div>
  )
}
