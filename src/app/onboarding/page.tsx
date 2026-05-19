import { redirect } from "next/navigation"

import { auth } from "@/auth"
import OnboardingWizard from "@/components/onboarding/OnboardingWizard"
import Navbar from "@/components/ui/Navbar"
import { prisma } from "@/lib/prisma"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [user, platforms, roomCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardedAt: true },
    }),
    prisma.platformConnection.findMany({
      where: { userId: session.user.id },
      select: { platform: true, channelName: true },
    }),
    prisma.room.count({ where: { hostId: session.user.id } }),
  ])

  // Already onboarded or has data — bounce to dashboard
  if (user?.onboardedAt || roomCount > 0) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar />
      <OnboardingWizard
        firstName={session.user.name?.split(" ")[0] ?? null}
        initialPlatforms={platforms.map((p) => ({
          platform: p.platform.toLowerCase(),
          channelName: p.channelName,
        }))}
      />
    </div>
  )
}
