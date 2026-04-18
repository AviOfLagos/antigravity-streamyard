import Link from "next/link"
import { Zap } from "lucide-react"

type Tag = "feat" | "fix" | "improvement" | "security"

interface ChangeItem {
  tag: Tag
  text: string
}

interface ChangelogEntry {
  date: string
  version: string
  title: string
  changes: ChangeItem[]
}

const tagStyles: Record<Tag, string> = {
  feat: "bg-violet-500/10 text-violet-400 border border-violet-500/20",
  fix: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  improvement: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  security: "bg-red-500/10 text-red-400 border border-red-500/20",
}

const tagLabels: Record<Tag, string> = {
  feat: "feat",
  fix: "fix",
  improvement: "improvement",
  security: "security",
}

const entries: ChangelogEntry[] = [
  {
    date: "Apr 18, 2026",
    version: "v0.5.0",
    title: "Edge Case Hardening",
    changes: [
      { tag: "security", text: "Session summary is now host-only — auth-gated" },
      { tag: "fix", text: "Tab reload no longer ends the studio session" },
      { tag: "fix", text: "Duplicate join requests now deduplicated" },
      { tag: "fix", text: "Room full check at request time, not admit time" },
      { tag: "fix", text: "Double-end race condition resolved with idempotent guard" },
      { tag: "fix", text: "SSE streams for ended rooms now return 404 immediately" },
      { tag: "fix", text: "Demo route validates token expiry and room claim" },
      { tag: "improvement", text: "Guest waiting state now times out after 3 minutes" },
      { tag: "improvement", text: "Host redirected with error context when entering wrong/ended room" },
      { tag: "improvement", text: "LiveKit disconnect overlay shown in studio" },
    ],
  },
  {
    date: "Apr 18, 2026",
    version: "v0.4.0",
    title: "Layout Presets & Backstage",
    changes: [
      { tag: "feat", text: "5 layout presets: Grid, Spotlight, Screen+Grid, Screen Only, Single" },
      { tag: "feat", text: "Backstage mode — guests join off-canvas, host brings them on stage" },
      { tag: "feat", text: "Participant strip with mic/cam indicators and Stage/Backstage buttons" },
      { tag: "improvement", text: "LayoutSelector added to ControlBar (hidden on mobile)" },
    ],
  },
  {
    date: "Apr 18, 2026",
    version: "v0.3.0",
    title: "Session Summary",
    changes: [
      { tag: "feat", text: "Post-session summary page at /session-summary/[code]" },
      { tag: "feat", text: "Stats: duration, participant count, peak participants, message count" },
      { tag: "feat", text: "Platform activity bar chart (CSS only)" },
      { tag: "feat", text: "Share to X and LinkedIn with pre-filled text" },
      { tag: "feat", text: "Copy stats to clipboard" },
      { tag: "feat", text: "DB fallback when Redis TTL expires" },
    ],
  },
  {
    date: "Apr 17, 2026",
    version: "v0.2.0",
    title: "Studio Redesign",
    changes: [
      { tag: "feat", text: "Full dark theme redesign (#0d0d0d, #080808)" },
      { tag: "feat", text: "Chat panel: platform left-border accents, hover timestamps, filter pills" },
      { tag: "fix", text: "Mic/cam/screen controls now work (ControlBar moved inside LiveKitRoom)" },
      { tag: "fix", text: "Guest admission bug fixed — dual auth (session + LiveKit JWT)" },
      { tag: "improvement", text: "Speaking ring on video tiles (violet glow)" },
      { tag: "improvement", text: "Mobile chat toggle with slide-in panel" },
    ],
  },
  {
    date: "Apr 16, 2026",
    version: "v0.1.0",
    title: "Initial Launch",
    changes: [
      { tag: "feat", text: "Google OAuth sign-in" },
      { tag: "feat", text: "Create studio rooms with LiveKit" },
      { tag: "feat", text: "Guest join flow with approval system" },
      { tag: "feat", text: "Live chat aggregation (YouTube, Twitch, Kick, TikTok)" },
      { tag: "feat", text: "SSE-based real-time events" },
      { tag: "feat", text: "Upstash Redis for event streaming" },
    ],
  },
]

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col">
      {/* Nav */}
      <nav className="bg-[#080808] border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span aria-hidden="true">&larr;</span>
          Back to home
        </Link>

        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white text-lg">Zerocast</span>
        </div>
      </nav>

      {/* Header */}
      <header className="py-16 px-6 max-w-3xl mx-auto w-full">
        <h1 className="text-4xl font-bold text-white mb-3">Changelog</h1>
        <p className="text-gray-300">
          What&apos;s new in Zerocast — features, fixes, and improvements.
        </p>
      </header>

      {/* Entries */}
      <main className="flex-1 px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-violet-500/30" />

          <div className="space-y-14">
            {entries.map((entry) => (
              <div key={entry.version} className="relative pl-8">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1.5 -translate-x-[3px] w-2 h-2 rounded-full bg-violet-500" />

                {/* Date + version */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-500 font-mono">{entry.date}</span>
                  <span
                    className={
                      "bg-violet-500/10 text-violet-400 text-xs font-mono px-2 py-0.5 rounded-full border border-violet-500/20"
                    }
                  >
                    {entry.version}
                  </span>
                </div>

                {/* Card */}
                <div className="bg-[#111111] border border-white/6 rounded-2xl p-6">
                  <h2 className="text-white font-semibold text-lg mb-4">{entry.title}</h2>

                  <ul className="space-y-2">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 shrink-0 text-xs font-mono px-1.5 py-0.5 rounded-full ${tagStyles[change.tag]}`}
                        >
                          {tagLabels[change.tag]}
                        </span>
                        <span className="text-gray-300 text-sm leading-5">{change.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/6 py-8 text-center text-gray-600 text-sm">
        &copy; 2026 Zerocast
      </footer>
    </div>
  )
}
