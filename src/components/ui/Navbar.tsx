import Link from "next/link"
import { auth, signOut } from "@/auth"
import { Button } from "@/components/ui/button"
import { Video } from "lucide-react"

export default async function Navbar() {
  const session = await auth()

  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex justify-between items-center bg-gray-900">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-red-500 rounded-lg flex items-center justify-center">
          <Video className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-white">Zerocast Clone</span>
      </Link>
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">Dashboard</Link>
        <Link href="/settings/platforms" className="text-gray-400 hover:text-white text-sm transition-colors">Platforms</Link>
        <div className="flex items-center gap-2">
          {session?.user?.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
          )}
          <span className="text-gray-300 text-sm">{session?.user?.name}</span>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/" }) }}>
          <Button variant="ghost" size="sm" type="submit" className="text-gray-400">Sign out</Button>
        </form>
      </div>
    </nav>
  )
}
