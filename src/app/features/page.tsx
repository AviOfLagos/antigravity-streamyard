import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  Camera,
  Download,
  EyeOff,
  Globe,
  Headphones,
  LayoutGrid,
  MessageSquare,
  Mic,
  Monitor,
  Radio,
  Shield,
  UserX,
  Users,
  Video,
  Zap,
} from "lucide-react"

interface FeatureCategory {
  title: string
  description: string
  features: {
    icon: React.ReactNode
    name: string
    detail: string
    status: "live" | "coming-soon"
  }[]
}

const categories: FeatureCategory[] = [
  {
    title: "Studio & Video",
    description: "Professional live studio running entirely in your browser.",
    features: [
      { icon: <Video className="w-4 h-4" />, name: "HD Video Grid", detail: "Up to 6 participants on screen at once with 720p video and adaptive bitrate.", status: "live" },
      { icon: <LayoutGrid className="w-4 h-4" />, name: "5 Layout Presets", detail: "Grid, Spotlight, Screen+Grid, Screen Only, Single — switch layouts live without interrupting your stream.", status: "live" },
      { icon: <Monitor className="w-4 h-4" />, name: "Screen Sharing", detail: "Share your screen, a window, or a tab. Guests can see your screen in real time.", status: "live" },
      { icon: <EyeOff className="w-4 h-4" />, name: "Backstage Mode", detail: "Guests join backstage first. The host reviews and brings them on stage when ready.", status: "live" },
      { icon: <Zap className="w-4 h-4" />, name: "Text Overlays", detail: "Add text to the stage with 6 positions, 3 font sizes, custom text and background colors. Synced to all participants.", status: "live" },
      { icon: <Zap className="w-4 h-4" />, name: "Stage Background", detail: "Change the canvas background color from a palette of dark-theme presets. Visible to all participants.", status: "live" },
      { icon: <Globe className="w-4 h-4" />, name: "100% Browser-Based", detail: "No downloads, no plugins. Works on Chrome, Edge, Firefox, Safari — any device, any OS.", status: "live" },
    ],
  },
  {
    title: "Audio",
    description: "Crystal-clear audio with real-time monitoring and device control.",
    features: [
      { icon: <Mic className="w-4 h-4" />, name: "VU Meter", detail: "Real-time mic level bars powered by Web Audio AnalyserNode. See your audio levels before and during the stream.", status: "live" },
      { icon: <Headphones className="w-4 h-4" />, name: "Device Selector", detail: "Pick your microphone, camera, and speaker from the control bar — available for both host and guests.", status: "live" },
      { icon: <Zap className="w-4 h-4" />, name: "Echo Cancellation", detail: "Built-in echo cancellation, noise suppression, and auto-gain control. No external software needed.", status: "live" },
    ],
  },
  {
    title: "Guests & Moderation",
    description: "Full control over who joins, what they can do, and when they leave.",
    features: [
      { icon: <Users className="w-4 h-4" />, name: "Guest Join Flow", detail: "Share a link — guests preview their camera/mic, request to join, and wait for approval. No account needed.", status: "live" },
      { icon: <Shield className="w-4 h-4" />, name: "Auto-Admit Mode", detail: "Toggle between manual approval and auto-admit. Perfect for open panels or invite-only sessions.", status: "live" },
      { icon: <UserX className="w-4 h-4" />, name: "Mute & Kick", detail: "Mute any guest's mic or camera. Remove disruptive participants with one click. Kicked guests see a clear notification with rejoin option.", status: "live" },
      { icon: <LayoutGrid className="w-4 h-4" />, name: "Layout Sync", detail: "Guests see the exact same layout the host selects — Grid, Spotlight, Screen+Grid — synced in real time via LiveKit data messages.", status: "live" },
      { icon: <Download className="w-4 h-4" />, name: "Guest Lead Capture", detail: "Optional email field on the join form. Collect guest contact info for follow-up — no account needed.", status: "live" },
    ],
  },
  {
    title: "Multi-Platform Chat",
    description: "Every platform's chat in one scrolling panel.",
    features: [
      { icon: <MessageSquare className="w-4 h-4" />, name: "Unified Chat", detail: "YouTube, Twitch, Kick, and TikTok chat messages in one panel with platform logos and color-coded badges.", status: "live" },
      { icon: <MessageSquare className="w-4 h-4" />, name: "Send Messages", detail: "Type a message and send it to YouTube and Twitch live chat directly from the studio.", status: "live" },
      { icon: <MessageSquare className="w-4 h-4" />, name: "Donations & Events", detail: "Super Chats, Bits/Cheers, TikTok gifts, subscriptions, raids, and follows — all displayed inline.", status: "live" },
      { icon: <MessageSquare className="w-4 h-4" />, name: "Collapsible Panel", detail: "Minimize the chat panel to a floating badge with unread count. Reopen anytime.", status: "live" },
    ],
  },
  {
    title: "Streaming",
    description: "Go live to multiple platforms simultaneously.",
    features: [
      { icon: <Radio className="w-4 h-4" />, name: "Multi-Platform RTMP", detail: "Stream to YouTube, Twitch, Kick, and TikTok at the same time via LiveKit Egress.", status: "live" },
      { icon: <Radio className="w-4 h-4" />, name: "Custom RTMP", detail: "Add up to 10 custom RTMP destinations — Facebook Live, LinkedIn, Restream, or your own server.", status: "live" },
      { icon: <Radio className="w-4 h-4" />, name: "YouTube Backup URL", detail: "Automatic backup ingest URL support prevents 'duplicate ingestion' warnings on unstable connections.", status: "live" },
      { icon: <Camera className="w-4 h-4" />, name: "Stream Thumbnail", detail: "Set a custom thumbnail URL when creating your studio — uploaded to YouTube via the Data API when OAuth is connected.", status: "live" },
      { icon: <Video className="w-4 h-4" />, name: "Recording", detail: "Record your entire session to MP4 — audio, video, and screen captured via LiveKit Egress with elapsed timer.", status: "live" },
    ],
  },
  {
    title: "Analytics & Data",
    description: "Post-session insights and exportable data.",
    features: [
      { icon: <BarChart2 className="w-4 h-4" />, name: "Session Summary", detail: "Duration, participant count, peak viewers, message count, and platform activity charts after every session.", status: "live" },
      { icon: <BarChart2 className="w-4 h-4" />, name: "Social Sharing", detail: "Share your session stats to X and LinkedIn with pre-filled text. Copy stats to clipboard.", status: "live" },
    ],
  },
  {
    title: "Security & Reliability",
    description: "Production-grade hardening for every endpoint.",
    features: [
      { icon: <Shield className="w-4 h-4" />, name: "Rate Limiting", detail: "All 22 mutation and polling endpoints protected by Upstash sliding window rate limits. Generous defaults — 429 responses with Retry-After headers.", status: "live" },
      { icon: <Shield className="w-4 h-4" />, name: "Input Sanitization", detail: "HTML stripped from all user-provided strings (names, messages, channels) via Zod transforms — XSS prevention at the schema layer.", status: "live" },
      { icon: <Shield className="w-4 h-4" />, name: "CSP Headers", detail: "Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, and strict Referrer-Policy on all responses.", status: "live" },
      { icon: <Shield className="w-4 h-4" />, name: "AI Chat Responder", detail: "Gemini-powered auto-replies to viewer questions — host-triggered, with sanitized input to prevent prompt injection.", status: "live" },
    ],
  },
]

export default function FeaturesPage() {
  const liveCount = categories.reduce((acc, cat) => acc + cat.features.filter((f) => f.status === "live").length, 0)
  const comingSoonCount = categories.reduce((acc, cat) => acc + cat.features.filter((f) => f.status === "coming-soon").length, 0)

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#080808]/80 backdrop-blur-md border-b border-white/6">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Zerocast</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/changelog" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Changelog</Link>
            <Link href="/status" className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5">Status</Link>
            <div className="w-px h-4 bg-white/10 mx-2 hidden sm:block" />
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-full transition-colors">
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <header className="pt-20 pb-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            {liveCount} live features + {comingSoonCount} coming soon
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Everything you need to <span className="text-violet-400">go live</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A complete browser-based live streaming studio. No downloads, no plugins — just open a tab and start broadcasting to every platform.
          </p>
        </div>
      </header>

      {/* Feature categories */}
      <main className="px-6 pb-20">
        <div className="max-w-5xl mx-auto space-y-16">
          {categories.map((category) => (
            <section key={category.title}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-1">{category.title}</h2>
                <p className="text-gray-500 text-sm">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {category.features.map((feature) => (
                  <div
                    key={feature.name}
                    className={[
                      "bg-[#111111] border rounded-xl p-5 transition-colors",
                      feature.status === "live"
                        ? "border-white/6 hover:border-white/12"
                        : "border-dashed border-white/8 opacity-60",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <div className={[
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        feature.status === "live" ? "bg-violet-500/10 text-violet-400" : "bg-gray-500/10 text-gray-500",
                      ].join(" ")}>
                        {feature.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium text-sm">{feature.name}</h3>
                          {feature.status === "coming-soon" && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                              Coming Soon
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-xs leading-relaxed">{feature.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-white/6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to try it?</h2>
          <p className="text-gray-400 mb-8">Create your first studio in seconds — no credit card, no setup.</p>
          <Link href="/login" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-8 py-3 rounded-xl transition-colors">
            Create Studio Free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Zerocast</span>
            <span className="text-gray-600 text-sm ml-2">&copy; 2026</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/features" className="text-sm text-violet-400 transition-colors">Features</Link>
            <Link href="/changelog" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Changelog</Link>
            <Link href="/status" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Status</Link>
            <Link href="/feedback" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Feedback</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
