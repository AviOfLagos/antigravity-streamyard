import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { platform } = await req.json()
  if (!platform) return NextResponse.json({ error: "Missing platform" }, { status: 400 })

  await prisma.platformConnection.deleteMany({
    where: { userId: session.user.id, platform },
  })

  return NextResponse.json({ ok: true })
}
