import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { getCachedRoom } from "@/lib/room-cache"
import { saveStudioState, loadStudioState } from "@/lib/redis"

/**
 * GET /api/rooms/[code]/state — Load persisted studio state
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Only the host can load state
  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const state = await loadStudioState(code)
  return NextResponse.json({ state })
}

/**
 * PUT /api/rooms/[code]/state — Save studio state (debounced client-side)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  try {
    const body = await req.json()
    await saveStudioState(code, body)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }
}
