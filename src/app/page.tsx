import Link from "next/link"
import { Button } from "@/components/ui/button"
import { auth } from "@/auth"
import { Video, Users, MessageSquare, Zap } from "lucide-react"

export default async function LandingPage() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <Video className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-lg">Zerocast Clone</span>
        </div>
        <div className="flex gap-3">
          {session?.user ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300">Sign In</Button>
              </Link>
              <Link href="/login">
                <Button className="bg-red-500 hover:bg-red-600">Get Started Free</Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-4 py-1.5 text-sm mb-6">
            <Zap className="w-3.5 h-3.5" />
            Browser-based live studio
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Go Live on Every Platform{" "}
            <span className="text-red-500">in Seconds</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10">
            Invite guests, aggregate chat from YouTube, Twitch, Kick, and TikTok — all in one studio. No downloads required.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-red-500 hover:bg-red-600 text-white px-8">
                Create Your Studio
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: <Users className="w-6 h-6 text-red-400" />,
              title: "Invite Guests",
              description: "Share a link and add up to 5 guests to your studio. Admit or deny with one click.",
            },
            {
              icon: <MessageSquare className="w-6 h-6 text-red-400" />,
              title: "Unified Chat",
              description: "See YouTube, Twitch, Kick, and TikTok chat in one scrolling panel. Never miss a message.",
            },
            {
              icon: <Video className="w-6 h-6 text-red-400" />,
              title: "Professional Layout",
              description: "Auto-arranging video grid. Toggle guests on/off screen. Full studio controls.",
            },
          ].map((f) => (
            <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
              <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-500 text-sm">
        Zerocast Clone — Built with Next.js, LiveKit, and ❤️
      </footer>
    </div>
  )
}
