import { NextResponse } from "next/server"

import { loadPublicRecap } from "@/lib/recap"

/**
 * F-26: GET /api/rooms/[code]/recap/public
 *
 * Sanitised session recap for the post-stream landing page. No auth required.
 * Returns 404 when the room never went live, hasn't ended, or no summary
 * exists. Never exposes host email, guest emails, raw chat content, stream
 * keys, OAuth tokens, or recording URLs.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const recap = await loadPublicRecap(code)
  if (!recap) {
    return NextResponse.json({ error: "Recap not available" }, { status: 404 })
  }
  return NextResponse.json({ recap })
}
