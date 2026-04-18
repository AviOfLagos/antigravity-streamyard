import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Navbar from "@/components/ui/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Video, Clock } from "lucide-react"
import Link from "next/link"
import CreateStudioButton from "@/components/dashboard/CreateStudioButton"
import PlatformSummary from "@/components/dashboard/PlatformSummary"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [rooms, platforms] = await Promise.all([
    prisma.room.findMany({
      where: { hostId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.platformConnection.findMany({
      where: { userId: session.user.id },
    }),
  ])

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Your Studio</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {session.user.name?.split(" ")[0]}</p>
          </div>
          <CreateStudioButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <PlatformSummary platforms={platforms} />
        </div>

        {/* Rooms */}
        <h2 className="text-lg font-semibold text-white mb-4">Recent Studios</h2>
        {rooms.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-16 text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No studios yet. Create your first one!</p>
              <CreateStudioButton />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {rooms.map((room: typeof rooms[number]) => (
              <Card key={room.id} className="bg-gray-900 border-gray-800">
                <CardContent className="flex items-center justify-between py-4 px-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium font-mono">Room {room.code}</p>
                      <p className="text-gray-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(room.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={room.status === "active" ? "default" : "secondary"}>
                      {room.status}
                    </Badge>
                    {room.status === "active" && (
                      <Link href={`/studio/${room.code}`}>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600">Enter Studio</Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
