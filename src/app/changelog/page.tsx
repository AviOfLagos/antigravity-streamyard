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
    date: "Apr 25, 2026",
    version: "v1.2.0",
    title: "Platform Connector Upgrades & Chat Reply",
    changes: [
      { tag: "feat", text: "Send messages to YouTube and Twitch live chat directly from the studio" },
      { tag: "feat", text: "Chat input for hosts — type a message and it goes to all connected platforms" },
      { tag: "feat", text: "Twitch reply threading — replies show parent message context in the chat panel" },
      { tag: "feat", text: "YouTube Super Chats and Super Stickers displayed as donation events with amounts" },
      { tag: "feat", text: "Twitch Bits/Cheers displayed as donations, subs/resubs/gift subs as subscription events" },
      { tag: "feat", text: "Twitch raids shown with viewer count badge" },
      { tag: "feat", text: "TikTok gifts shown as donations with diamond-to-USD conversion" },
      { tag: "feat", text: "Follow events captured from Twitch, Kick, and TikTok" },
      { tag: "feat", text: "Kick subscription and gifted sub events captured via Pusher" },
      { tag: "improvement", text: "YouTube polling now uses dynamic interval from API response instead of fixed 20s" },
      { tag: "improvement", text: "Chat UI: color-coded event types — donations (yellow), subs (violet), follows (green), raids (blue)" },
      { tag: "improvement", text: "TikTok like events shown as compact one-line display, join events filtered to reduce noise" },
      { tag: "improvement", text: "Author badges parsed from all platforms (moderator, subscriber, VIP, owner)" },
    ],
  },
  {
    date: "Apr 24, 2026",
    version: "v1.1.0",
    title: "Access Control & Guest Leads",
    changes: [
      { tag: "feat", text: "Auto-admit mode — guests join instantly without host approval when enabled" },
      { tag: "feat", text: "Manual approval mode — host reviews and admits each guest individually (default)" },
      { tag: "feat", text: "Guest email capture — optional email field on join form for lead collection, no account needed" },
      { tag: "feat", text: "Guest lead database — emails and names stored per room for marketing teams" },
      { tag: "improvement", text: "Access control toggle in studio creation modal with clear descriptions" },
    ],
  },
  {
    date: "Apr 24, 2026",
    version: "v1.0.0",
    title: "Host Moderation & Edge Case Hardening",
    changes: [
      { tag: "feat", text: "Mute/unmute guest mic and camera — host can toggle any guest's audio or video" },
      { tag: "feat", text: "Kick participant — remove a guest from the studio with one click" },
      { tag: "feat", text: "Participant count shown in studio view" },
      { tag: "feat", text: "Feedback page — users can submit bug reports, feature requests, and general feedback" },
      { tag: "fix", text: "Deny route now supports demo mode (LiveKit JWT auth)" },
      { tag: "fix", text: "Guest leave now sends identity — participant leftAt properly recorded in DB" },
      { tag: "fix", text: "Pending names freed on admit/deny — guests can re-request with the same name" },
      { tag: "fix", text: "Admit errors now shown to host as toast notifications instead of silent failures" },
      { tag: "fix", text: "GUEST_LEFT events clean stale participant IDs from on-screen list" },
      { tag: "improvement", text: "Backstage panel shows empty state when no guests have joined" },
      { tag: "improvement", text: "ParticipantRow shows host badge, mic/cam/kick controls for guests" },
      { tag: "improvement", text: "Changelog updated to cover all releases from v0.1.0 to v1.1.0" },
    ],
  },
  {
    date: "Apr 24, 2026",
    version: "v0.9.0",
    title: "Feedback System",
    changes: [
      { tag: "feat", text: "Feedback page at /feedback — submit bug reports, feature requests, or general feedback" },
      { tag: "feat", text: "Feedback stored in Redis with 90-day TTL (last 1000 entries)" },
      { tag: "improvement", text: "Feedback links added to landing page nav, footer, and changelog" },
    ],
  },
  {
    date: "Apr 20, 2026",
    version: "v0.8.0",
    title: "Audio Autoplay & DB Resilience",
    changes: [
      { tag: "fix", text: "Browser audio autoplay — StartAudio button appears when browser blocks audio without user gesture" },
      { tag: "fix", text: "Neon DB resilience — 3-layer retry with exponential backoff for free-tier connection drops" },
      { tag: "improvement", text: "Redis caching (60s TTL) eliminates ~80% of DB reads across 15+ routes" },
      { tag: "improvement", text: "Cache invalidation on room status mutations for data freshness" },
    ],
  },
  {
    date: "Apr 19, 2026",
    version: "v0.7.0",
    title: "Platform Connections & Streaming",
    changes: [
      { tag: "feat", text: "Platform connection management — connect YouTube, Twitch, Kick, TikTok stream keys" },
      { tag: "feat", text: "Live streaming to connected platforms from the studio" },
      { tag: "improvement", text: "Studio UI improvements — refined controls and layout" },
      { tag: "security", text: "Rate limiting on guest requests and API routes" },
    ],
  },
  {
    date: "Apr 19, 2026",
    version: "v0.6.0",
    title: "Schema Migration & Sign-in Fix",
    changes: [
      { tag: "fix", text: "Schema enum migration — resolved Prisma enum conflicts on deploy" },
      { tag: "fix", text: "Auto sign-in after OAuth — no more redirect loops" },
      { tag: "fix", text: "Neon retry logic improved with pgbouncer params" },
      { tag: "improvement", text: "Room status UX — clearer lobby/live/ended states" },
    ],
  },
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
      <footer className="border-t border-white/6 py-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-gray-600 text-sm">&copy; 2026 Zerocast</span>
          <Link
            href="/feedback"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            Report an issue
          </Link>
        </div>
      </footer>
    </div>
  )
}
