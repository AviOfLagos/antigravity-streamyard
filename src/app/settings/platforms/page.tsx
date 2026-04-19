import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Navbar from "@/components/ui/Navbar"

import PlatformConnectForm from "@/components/dashboard/PlatformConnectForm"

export default async function PlatformsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
  })

  // Map keyed by lowercase platform name for backward compat with PlatformConnectForm
  const connectedMap = Object.fromEntries(
    connections.map((c: typeof connections[number]) => [c.platform.toLowerCase(), c])
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Platform Connections</h1>
        <p className="text-gray-400 text-sm mb-8">
          Connect your streaming accounts to show chat in the studio. Twitch, Kick, and TikTok only need your channel name — no OAuth required.
        </p>
        <div className="space-y-4">
          <PlatformConnectForm
            platform="twitch"
            label="Twitch"
            color="bg-purple-600"
            placeholder="your-channel-name"
            helpText="Your Twitch channel name (e.g. pokimane)"
            connection={connectedMap.twitch ?? null}
          />
          <PlatformConnectForm
            platform="kick"
            label="Kick"
            color="bg-green-600"
            placeholder="your-channel-name"
            helpText="Your Kick channel name"
            connection={connectedMap.kick ?? null}
          />
          <PlatformConnectForm
            platform="tiktok"
            label="TikTok"
            color="bg-gray-700"
            placeholder="@your-username"
            helpText="Your TikTok username (used for live chat when you're streaming)"
            connection={connectedMap.tiktok ?? null}
          />
          <PlatformConnectForm
            platform="youtube"
            label="YouTube"
            color="bg-red-600"
            placeholder="UC..."
            helpText="Your YouTube channel ID (starts with UC). Sign in with Google to enable YouTube chat."
            connection={connectedMap.youtube ?? null}
          />
        </div>
      </div>
    </div>
  )
}
