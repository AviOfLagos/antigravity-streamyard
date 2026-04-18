"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"

export default function CreateStudioButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/rooms", { method: "POST" })
      const data = await res.json()
      if (data.code) {
        router.push(`/studio/${data.code}`)
      }
    } catch (err) {
      console.error("Failed to create studio:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className="bg-red-500 hover:bg-red-600 text-white"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
      ) : (
        <><Plus className="w-4 h-4 mr-2" />Create Studio</>
      )}
    </Button>
  )
}
