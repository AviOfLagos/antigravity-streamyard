import Link from "next/link"
import { Video } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudioEndedPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-6">
          <Video className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Studio Has Ended</h1>
        <p className="text-gray-400 mb-6">This streaming session has ended. Thanks for joining!</p>
        <Link href="/">
          <Button className="bg-red-500 hover:bg-red-600">Back to Home</Button>
        </Link>
      </div>
    </div>
  )
}
