import Link from "next/link"
import { Zap, ExternalLink, Terminal, Globe, CheckCircle2, AlertCircle } from "lucide-react"

export default function QAPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Nav */}
      <nav className="border-b border-white/6 px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
        >
          <span aria-hidden>&larr;</span> Back to home
        </Link>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-violet-400" />
          <span className="font-bold text-white text-lg">Zerocast</span>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <h1 className="text-3xl font-bold text-white mb-3">QA Testing Guide</h1>
        <p className="text-gray-400 mb-10">
          Everything you need to set up, test, and verify Zerocast. Follow these steps in order.
        </p>

        {/* Step 1: Clone & Setup */}
        <Section number="01" title="Clone & Install">
          <Step icon={<Terminal className="w-4 h-4" />} title="Clone the repository">
            <Code>git clone https://github.com/AviOfLagos/antigravity-streamyard.git</Code>
            <Code>cd antigravity-streamyard</Code>
            <Code>npm install</Code>
          </Step>

          <Step icon={<AlertCircle className="w-4 h-4" />} title="Get the .env.local file">
            <p className="text-gray-400 text-sm mb-2">
              Request the <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">.env.local</code> file from the project lead. It contains credentials for:
            </p>
            <ul className="text-gray-400 text-sm space-y-1 ml-4 list-disc">
              <li>Neon Postgres (DATABASE_URL, DIRECT_URL)</li>
              <li>Upstash Redis (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)</li>
              <li>LiveKit Cloud (LIVEKIT_API_KEY, LIVEKIT_API_SECRET, NEXT_PUBLIC_LIVEKIT_URL)</li>
              <li>NextAuth (NEXTAUTH_SECRET, NEXTAUTH_URL)</li>
              <li>Google OAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)</li>
            </ul>
            <p className="text-yellow-400/70 text-xs mt-2">
              Never commit .env.local to git. It&apos;s already in .gitignore.
            </p>
          </Step>

          <Step icon={<Terminal className="w-4 h-4" />} title="Generate Prisma client & start dev server">
            <Code>npx prisma generate</Code>
            <Code>npm run dev</Code>
            <p className="text-gray-500 text-sm mt-1">
              App runs at <a href="http://localhost:3000" className="text-violet-400 hover:underline">http://localhost:3000</a>
            </p>
          </Step>
        </Section>

        {/* Step 2: Run Tests */}
        <Section number="02" title="Run Automated Tests">
          <Step icon={<CheckCircle2 className="w-4 h-4" />} title="Unit tests (114 tests)">
            <Code>npm test</Code>
            <p className="text-gray-500 text-sm mt-1">All tests should pass. If any fail, report immediately.</p>
          </Step>
          <Step icon={<Terminal className="w-4 h-4" />} title="Production build check">
            <Code>npx next build</Code>
            <p className="text-gray-500 text-sm mt-1">Should compile with zero lint warnings.</p>
          </Step>
        </Section>

        {/* Step 3: API Testing */}
        <Section number="03" title="API Testing (Postman)">
          <Step icon={<Globe className="w-4 h-4" />} title="Import the Postman collection">
            <p className="text-gray-400 text-sm mb-2">
              Find <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">docs/zerocast-api.postman_collection.json</code> in the repo.
            </p>
            <ol className="text-gray-400 text-sm space-y-1 ml-4 list-decimal">
              <li>Open Postman &rarr; Import &rarr; drag the JSON file</li>
              <li>Set the <code className="text-violet-400">baseUrl</code> variable to <code className="text-gray-300">http://localhost:3000</code></li>
              <li>Sign in via browser, then copy session cookie for authenticated requests</li>
              <li>Create a room first to get <code className="text-violet-400">roomCode</code> and <code className="text-violet-400">hostToken</code></li>
            </ol>
          </Step>
          <p className="text-gray-500 text-sm">
            The collection covers 25 endpoints across 6 categories: Health, Rooms, Guest Flow, Moderation, Chat, Streaming, and Platforms.
          </p>
        </Section>

        {/* Step 4: Manual Testing */}
        <Section number="04" title="Manual Testing Checklist">
          <p className="text-gray-400 text-sm mb-4">
            Follow the full QA test plan at{" "}
            <code className="text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">docs/qa-test-plan.md</code>{" "}
            in the repo. Key areas:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { area: "Authentication", tests: "Sign in, sign out, protected routes" },
              { area: "Studio Creation", tests: "Title, platforms, auto-admit toggle" },
              { area: "Guest Join Flow", tests: "Name, email, preview, waiting, admit, deny" },
              { area: "Video & Audio", tests: "Camera, mic, speaker selection, speaking indicator" },
              { area: "Host Moderation", tests: "Mute, kick, stage/backstage" },
              { area: "Chat Integration", tests: "Messages, donations, subs, follows, raids" },
              { area: "Send to Chat", tests: "Host sends to YouTube + Twitch" },
              { area: "Go Live", tests: "Start/stop stream, add/remove platforms" },
              { area: "Edge Cases", tests: "Room full, timeout, disconnect, ended room" },
              { area: "Cross-Browser", tests: "Chrome, Firefox, Safari, mobile" },
            ].map((item) => (
              <div key={item.area} className="bg-[#111111] border border-white/6 rounded-xl px-4 py-3">
                <p className="text-sm font-medium text-white">{item.area}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.tests}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Step 5: Multi-User Testing */}
        <Section number="05" title="Multi-User Testing">
          <p className="text-gray-400 text-sm mb-3">
            Zerocast is a multi-user app. You need at least 2 browser windows to test properly:
          </p>
          <ol className="text-gray-400 text-sm space-y-2 ml-4 list-decimal">
            <li>
              <strong className="text-white">Window 1 (Host):</strong> Sign in &rarr; Create studio &rarr; Enter studio
            </li>
            <li>
              <strong className="text-white">Window 2 (Guest):</strong> Open incognito &rarr; Go to <code className="text-violet-400">/join/&#123;code&#125;</code> &rarr; Enter name &rarr; Request to join
            </li>
            <li>
              <strong className="text-white">Host window:</strong> See toast &rarr; Admit or Deny
            </li>
            <li>
              <strong className="text-white">Both windows:</strong> Verify video/audio works in both directions
            </li>
          </ol>
          <p className="text-yellow-400/70 text-xs mt-3">
            Tip: Use Chrome + Incognito Chrome, or Chrome + Firefox for two separate sessions.
          </p>
        </Section>

        {/* Step 6: Reporting */}
        <Section number="06" title="Reporting Issues">
          <p className="text-gray-400 text-sm mb-3">
            Use one of these channels to report bugs:
          </p>
          <div className="space-y-2">
            <a
              href="/feedback"
              className="flex items-center gap-2 bg-[#111111] border border-white/6 rounded-xl px-4 py-3 text-sm text-violet-400 hover:border-violet-500/30 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Submit via /feedback page (bug report form)
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
            <a
              href="https://github.com/AviOfLagos/antigravity-streamyard/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#111111] border border-white/6 rounded-xl px-4 py-3 text-sm text-gray-300 hover:border-white/10 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844a9.59 9.59 0 012.504.338c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12c0-5.523-4.477-10-10-10z" /></svg>
              Open GitHub Issue
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          </div>
          <p className="text-gray-500 text-sm mt-3">
            Include: steps to reproduce, expected vs actual behavior, browser/OS, and screenshots if possible.
          </p>
        </Section>

        {/* Quick Links */}
        <div className="mt-16 pt-8 border-t border-white/6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: "/", label: "Landing Page" },
              { href: "/login", label: "Sign In" },
              { href: "/dashboard", label: "Dashboard" },
              { href: "/changelog", label: "Changelog" },
              { href: "/status", label: "System Status" },
              { href: "/feedback", label: "Submit Feedback" },
              { href: "/settings/platforms", label: "Platform Settings" },
              { href: "/studio-ended", label: "Studio Ended" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-[#111111] border border-white/6 rounded-xl px-3 py-2 text-xs text-gray-400 hover:text-white hover:border-white/10 transition-colors text-center"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/6 py-8 px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <span className="text-gray-600 text-sm">&copy; 2026 Zerocast</span>
          <span className="text-gray-600 text-sm">v1.2.0</span>
        </div>
      </footer>
    </div>
  )
}

// ── Helper Components ─────────────────────────────────────────────────────────

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-4xl font-black text-violet-500/20 leading-none select-none">{number}</span>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4 pl-2">{children}</div>
    </section>
  )
}

function Step({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111111] border border-white/6 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-violet-400">{icon}</span>
        <h3 className="text-sm font-medium text-white">{title}</h3>
      </div>
      <div className="pl-6">{children}</div>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-black/30 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono mb-1.5 overflow-x-auto">
      <code>{children}</code>
    </pre>
  )
}
