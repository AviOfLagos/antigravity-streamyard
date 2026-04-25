import Link from "next/link"
import { auth } from "@/auth"
import {
  ArrowRight,
  BarChart2,
  EyeOff,
  Globe,
  LayoutGrid,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react"

export default async function LandingPage() {
  const session = await auth()

  const features = [
    {
      icon: <Users className="w-5 h-5 text-violet-400" />,
      title: "Invite Guests",
      description:
        "Share a link and add up to 5 guests to your studio. Admit or deny with one click — no app install required.",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-violet-400" />,
      title: "Unified Chat",
      description:
        "YouTube, Twitch, Kick, and TikTok chat in one scrolling panel. Never miss a message from any platform.",
    },
    {
      icon: <LayoutGrid className="w-5 h-5 text-violet-400" />,
      title: "Layout Presets",
      description:
        "Grid, Spotlight, Screen+Grid, Screen Only, Single — switch between layouts live without interrupting your stream.",
    },
    {
      icon: <EyeOff className="w-5 h-5 text-violet-400" />,
      title: "Backstage Mode",
      description:
        "Guests join backstage first. The host reviews and brings them on stage when ready — total control, no surprises.",
    },
    {
      icon: <BarChart2 className="w-5 h-5 text-violet-400" />,
      title: "Session Summary",
      description:
        "Post-session stats, duration, viewer charts, and social sharing — everything you need to review your stream.",
    },
    {
      icon: <Globe className="w-5 h-5 text-violet-400" />,
      title: "No Downloads",
      description:
        "100% browser-based. Works on any device, any OS. Open a tab and you're live — zero friction for you or your guests.",
    },
  ]

  const steps = [
    {
      number: "01",
      title: "Create your studio",
      description:
        "Sign in once, click to start a studio. Your room is ready in seconds.",
    },
    {
      number: "02",
      title: "Invite your guests",
      description:
        "Share a link. Guests join backstage and you approve them with one click.",
    },
    {
      number: "03",
      title: "Go live",
      description:
        "Pick your layout, merge your chats, and stream to every platform from one place.",
    },
  ]

  const platforms = [
    { name: "YouTube", color: "bg-red-500" },
    { name: "Twitch", color: "bg-purple-500" },
    { name: "Kick", color: "bg-green-500" },
    { name: "TikTok", color: "bg-pink-500" },
  ]

  return (
    <div className="min-h-screen bg-[#080808]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#080808]/80 backdrop-blur-md border-b border-white/6">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center group-hover:bg-violet-500 transition-colors">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">Zerocast</span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-1">
            <Link
              href="/changelog"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Changelog
            </Link>
            <Link
              href="/status"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Status
            </Link>
            <Link
              href="/feedback"
              className="hidden sm:block text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              Feedback
            </Link>

            <div className="w-px h-4 bg-white/10 mx-2 hidden sm:block" />

            {session?.user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-full transition-colors"
              >
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-full transition-colors ml-1"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-20 px-6">
        {/* Background radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,92,246,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
            <span className="text-violet-400 text-xs">✦</span>
            Browser-based live studio
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] text-white mb-6">
            Go live everywhere,
            <br />
            <span className="text-violet-400">from one studio.</span>
          </h1>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Invite guests, merge chat from every platform, pick your layout — all from your
            browser. No downloads, no complexity.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Create Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-white/6 hover:bg-white/10 text-white border border-white/8 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              View demo
            </Link>
          </div>

          {/* Platform pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-gray-500 mr-1">Streams to</span>
            {platforms.map((p) => (
              <div
                key={p.name}
                className="inline-flex items-center gap-1.5 bg-white/4 border border-white/6 rounded-full px-3 py-1 text-xs text-gray-300"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${p.color}`} />
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Everything you need to go live
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              All the tools professional streamers need, built into one clean browser-based studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#111111] border border-white/6 rounded-2xl p-6 hover:border-white/10 transition-colors"
              >
                <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-white/6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Up and running in minutes
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              No setup, no configuration files, no hardware. Just open a browser and go.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="text-7xl font-black text-violet-500/20 leading-none mb-4 select-none">
                  {step.number}
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-3xl p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              Ready to go live?
            </h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Join streamers who use Zerocast to broadcast professionally — right from their browser.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-medium px-8 py-3 rounded-xl transition-colors"
            >
              Create Your Studio Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/6 bg-[#080808]">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-600 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white text-sm">Zerocast</span>
            <span className="text-gray-600 text-sm ml-2">© 2026 Zerocast</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <Link
              href="/changelog"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Changelog
            </Link>
            <Link
              href="/status"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Status
            </Link>
            <Link
              href="/feedback"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Feedback
            </Link>
            <a
              href="https://github.com/AviOfLagos/antigravity-streamyard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
