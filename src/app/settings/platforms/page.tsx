import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Navbar from "@/components/ui/Navbar"
import { getTokenHealth, type PlatformConnectionRow } from "@/lib/auth/token-refresh"

import PlatformConnectForm from "@/components/dashboard/PlatformConnectForm"

export default async function PlatformsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const connections = await prisma.platformConnection.findMany({
    where: { userId: session.user.id },
  })

  // Build a map with token health info
  const connectedMap = Object.fromEntries(
    connections.map((c: typeof connections[number]) => [
      c.platform.toLowerCase(),
      {
        channelName: c.channelName,
        channelId: c.channelId,
        tokenHealth: getTokenHealth(c as PlatformConnectionRow),
        expiresAt: c.expiresAt?.toISOString() ?? null,
        hasStreamKey: !!c.streamKey,
        hasIngestUrl: !!c.ingestUrl,
      },
    ])
  )

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-2">Platform Connections</h1>
        <p className="text-gray-400 text-sm mb-8">
          Connect your streaming platforms to broadcast and read live chat. Each platform needs a channel name and a stream key to go live.
        </p>
        <div className="space-y-4">
          <PlatformConnectForm
            platform="youtube"
            label="YouTube"
            color="bg-red-600"
            placeholder="Your channel name"
            helpText="Your YouTube channel name or ID. Go to YouTube Studio → Go Live → Stream settings for your stream key."
            connection={connectedMap.youtube ?? null}
          />
          <PlatformConnectForm
            platform="twitch"
            label="Twitch"
            color="bg-purple-600"
            placeholder="your-channel-name"
            helpText="Your Twitch channel name (e.g. pokimane). Find stream key in Creator Dashboard → Settings → Stream."
            connection={connectedMap.twitch ?? null}
          />
          <PlatformConnectForm
            platform="kick"
            label="Kick"
            color="bg-green-600"
            placeholder="your-channel-name"
            helpText="Your Kick channel name. Find stream key in Kick Dashboard → Settings → Stream."
            connection={connectedMap.kick ?? null}
          />
          <PlatformConnectForm
            platform="tiktok"
            label="TikTok"
            color="bg-gray-700"
            placeholder="@your-username"
            helpText="Your TikTok username. Get RTMP URL + stream key from TikTok Live Center (requires 1000+ followers)."
            connection={connectedMap.tiktok ?? null}
          />
        </div>
      </div>
    </div>
  )
}
