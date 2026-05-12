import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Changelog | Zerocast",
  description: "What's new in Zerocast — features, fixes, and improvements.",
};

type Tag = "feat" | "fix" | "improvement" | "security";

interface ChangeItem {
  tag: Tag;
  text: string;
}

interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  changes: ChangeItem[];
}

const tagStyles: Record<Tag, string> = {
  feat: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
  fix: "text-amber-400 border-amber-500/20 bg-amber-500/5",
  improvement: "text-blue-400 border-blue-500/20 bg-blue-500/5",
  security: "text-red-400 border-red-500/20 bg-red-500/5",
};

const entries: ChangelogEntry[] = [
  {
    date: "May 11, 2026",
    version: "v2.1.0",
    title: "Marketing Site Overhaul & Beta Infrastructure",
    changes: [
      { tag: "feat", text: "Global BetaModal system triggered via ?beta=true query param across the entire app" },
      { tag: "feat", text: "BetaRequest database schema and API endpoint with 409 duplicate-email handling" },
      { tag: "improvement", text: "Complete marketing site redesign (NexProve product) — editorial layouts, oversized typography, no generic cards" },
      { tag: "improvement", text: "Global MarketingNav and Footer with full sitemap integration" },
      { tag: "improvement", text: "Expanded comparison table matrix (StreamYard, Restream, MelonApp, Zerocast)" },
    ],
  },
  {
    date: "May 4, 2026",
    version: "v2.0.0",
    title: "Phase 4 Hardening — Rate Limiting & Input Sanitization",
    changes: [
      { tag: "security", text: "Rate limiting on all 22 mutation/polling API endpoints via Upstash sliding window — generous limits (30/min host actions, 60/min polling, 5/min unauthenticated)" },
      { tag: "security", text: "HTML sanitization (stripHtml) on all user-provided strings — guest names, chat messages, channel names, RTMP destination names, feedback fields" },
      { tag: "security", text: "Zod .transform() sanitization — XSS prevention happens at schema validation time, before data reaches any handler" },
      { tag: "feat", text: "rateLimitGuard() helper — single-line rate limit check returning 429 with Retry-After header, fail-open on Redis errors" },
      { tag: "feat", text: "Feedback endpoint rewritten with Zod schema validation replacing manual parsing" },
      { tag: "improvement", text: "All rate-limited endpoints return standard headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After" },
      { tag: "improvement", text: "CSP headers (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options) already in place from v1.9" },
    ],
  },
  {
    date: "May 4, 2026",
    version: "v1.9.0",
    title: "Architecture Migration — SSE to LiveKit Data Channels",
    changes: [
      { tag: "feat", text: "SSE replaced with LiveKit data channels for host-to-guest event relay — lower latency, fewer open connections" },
      { tag: "feat", text: "Auto-layout switching — layout adapts automatically based on participant count and screen shares" },
      { tag: "feat", text: "AI chat responder — Gemini-powered auto-reply to viewer questions in chat (host-triggered)" },
      { tag: "feat", text: "Docker Compose local development — full stack (Postgres, Redis, LiveKit) with one command" },
      { tag: "feat", text: "RoomEventRelay component — host polls events-since endpoint and relays to guests via data channels" },
      { tag: "improvement", text: "70 new tests covering extended features (184 total)" },
      { tag: "security", text: "Security audit fixes from v1.8.0 review" },
    ],
  },
  {
    date: "Apr 29, 2026",
    version: "v1.8.0",
    title: "Guest Overhaul, UI Declutter, Chat Overlay & Reconnection",
    changes: [
      { tag: "feat", text: "Guest backstage panel — see all participants with role badges, mic/camera status, and speaking indicators (no moderation controls)" },
      { tag: "feat", text: "Guest chat input — guests can now type messages in chat, shown with teal 'Guest' badge" },
      { tag: "feat", text: "Guest screen sharing — dedicated screen share toggle button in guest control bar" },
      { tag: "feat", text: "Copy room link button for guests in header bar" },
      { tag: "feat", text: "TopToolbar — GoLive, Layout, Text, Invite, Settings, End moved above the stage; bottom bar is now just media controls" },
      { tag: "feat", text: "Twitch-style chat overlay on canvas — last 4 messages with auto-fade, configurable position (4 corners)" },
      { tag: "feat", text: "Text overlay timer — set duration in seconds, auto-hides when expired, shows countdown badge" },
      { tag: "feat", text: "Network quality indicator — signal strength icon (green/yellow/red) for host and guest" },
      { tag: "fix", text: "Canvas now centered with max-width 1280px and 16:9 aspect ratio — no more blank space when streaming" },
      { tag: "fix", text: "Connection timeouts — adaptive streaming, dynacast, custom reconnect policy (5 attempts, exponential backoff)" },
      { tag: "fix", text: "ConnectionMonitor shows attempt count, elapsed time, and refresh button after 5 failed attempts" },
      { tag: "improvement", text: "Control bar decluttered — only essential media controls on mobile; everything else in TopToolbar" },
    ],
  },
  {
    date: "Apr 29, 2026",
    version: "v1.7.0",
    title: "End Studio Dialog, Recording & Text Overlays",
    changes: [
      { tag: "feat", text: "Configurable end-studio dialog — checkboxes for stop streams, kick participants, with live platform warning" },
      { tag: "feat", text: "Session recording — Record button captures audio + video via LiveKit Egress to MP4 with elapsed timer" },
      { tag: "feat", text: "Text overlays — add text to the stage with 6 positions, 3 font sizes, custom colors and backgrounds" },
      { tag: "feat", text: "Stage background color — change the canvas background from a palette of dark-theme presets" },
      { tag: "feat", text: "Overlays and background sync to guests in real time via LiveKit data messages" },
      { tag: "improvement", text: "End studio stops active streams and kicks participants conditionally based on host selection" },
      { tag: "improvement", text: "Record button shows pulsing red dot with MM:SS elapsed timer while recording" },
    ],
  },
  {
    date: "Apr 29, 2026",
    version: "v1.6.0",
    title: "Layout Sync, Kick Notifications & YouTube Metadata",
    changes: [
      { tag: "feat", text: "Guest layout sync — guests now see the same layout preset the host selects (Grid, Spotlight, Screen+Grid, etc.) via LiveKit data messages" },
      { tag: "feat", text: "Kick notification — removed guests see a clear 'You were removed' screen with a 'Request to Rejoin' button" },
      { tag: "feat", text: "YouTube broadcast metadata — title, description, and thumbnail sent via YouTube Data API v3 when OAuth token is available" },
      { tag: "feat", text: "Thumbnail URL field in Create Studio modal for YouTube broadcasts" },
      { tag: "fix", text: "Host toast now says 'was removed' when kicking vs 'left the studio' when guest leaves voluntarily" },
      { tag: "improvement", text: "GoLivePanel shows per-platform OAuth status — auto metadata vs manual YouTube Studio link" },
      { tag: "improvement", text: "Kicked guest rejoin flow re-enters device preview with same name and email" },
    ],
  },
  {
    date: "Apr 29, 2026",
    version: "v1.5.0",
    title: "Chat Polish, Host Echo & Responsive UI",
    changes: [
      { tag: "feat", text: "Chat filter shows only connected platforms with real SVG logos and green ring indicator" },
      { tag: "feat", text: "Host-sent messages appear in chat window instantly with violet 'You' badge, broadcast to guests via SSE" },
      { tag: "feat", text: "YouTube backup ingest URL support — prevents 'duplicate ingestion' warnings on poor network" },
      { tag: "feat", text: "Collapsible chat panel on all screen sizes — floating badge with unread message count" },
      { tag: "feat", text: "Backup Server URL field in YouTube platform settings" },
      { tag: "fix", text: "Control bar (GoLive, End) always visible — no longer hidden behind chat on small screens" },
      { tag: "fix", text: "LayoutSelector hidden on mobile to free space for essential controls" },
      { tag: "improvement", text: "Guest studio gets chat toggle, collapsible panel, and unread badge matching host experience" },
    ],
  },
  {
    date: "Apr 28, 2026",
    version: "v1.4.0",
    title: "Audio Reliability & VU Meters",
    changes: [
      { tag: "feat", text: "Audio level indicator (VU meter) — real-time mic level bars for host and guest, powered by Web Audio AnalyserNode" },
      { tag: "feat", text: "Mic level preview on guest join screen — speak to verify your microphone before entering the studio" },
      { tag: "feat", text: "Guest device selector — guests can now pick camera, microphone, and speaker (previously host-only)" },
      { tag: "fix", text: "Preview-to-room mic handoff — 600ms release guard prevents browser mic conflict when transitioning from device preview to LiveKit room" },
      { tag: "fix", text: "LiveKit room now defers connect until preview tracks are fully released (connect={previewReleased})" },
      { tag: "improvement", text: "Audio architecture matches StreamYard/Google Meet SFU model — RoomAudioRenderer creates hidden audio elements per remote participant" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="text-white selection:bg-indigo-500/30">

      {/* Header */}
      <section className="px-6 pt-24 pb-16 max-w-7xl mx-auto border-b border-white/5">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-8">Changelog</p>
        <h1 className="font-black text-white tracking-tight leading-[0.95] mb-4"
          style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
          What&apos;s new.
        </h1>
        <p className="text-neutral-500 text-lg">Features, fixes, and improvements.</p>
      </section>

      {/* Entries */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="max-w-4xl space-y-24">
          {entries.map((entry) => (
            <div key={entry.version} className="relative">
              
              <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                {/* Meta column */}
                <div className="md:w-48 shrink-0 border-l-2 border-indigo-500/30 pl-4 py-1">
                  <span className="block text-sm font-bold text-white mb-1">{entry.version}</span>
                  <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">{entry.date}</span>
                </div>

                {/* Content column */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-8">{entry.title}</h2>
                  <div className="space-y-6">
                    {entry.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-4 pb-6 border-b border-white/5 last:border-0 last:pb-0">
                        <span className={`shrink-0 mt-0.5 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm border ${tagStyles[change.tag]}`}>
                          {change.tag}
                        </span>
                        <p className="text-neutral-400 text-sm leading-relaxed">{change.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-6 py-20 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <h2 className="font-black text-white text-3xl tracking-tight">Got a feature request?</h2>
          <Link href="/contact" className="shrink-0 inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-bold">
            Let us know <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
