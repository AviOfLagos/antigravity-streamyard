import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const CreateCustomRtmpSchema = z.object({
  name: z.string().min(1).max(50),
  ingestUrl: z.string().min(1).max(500),
  streamKey: z.string().min(1).max(500),
})

const DeleteCustomRtmpSchema = z.object({
  id: z.string().min(1),
})

// GET — list all custom RTMP destinations for the user
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const destinations = await prisma.customRtmpDestination.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, ingestUrl: true, createdAt: true },
  })

  return NextResponse.json({ destinations })
}

// POST — add a custom RTMP destination
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = CreateCustomRtmpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 })
  }

  const { name, ingestUrl, streamKey } = parsed.data

  // Limit to 10 custom destinations per user
  const count = await prisma.customRtmpDestination.count({ where: { userId: session.user.id } })
  if (count >= 10) {
    return NextResponse.json({ error: "Maximum 10 custom RTMP destinations" }, { status: 400 })
  }

  const destination = await prisma.customRtmpDestination.create({
    data: {
      userId: session.user.id,
      name,
      ingestUrl,
      streamKey,
    },
    select: { id: true, name: true, ingestUrl: true, createdAt: true },
  })

  return NextResponse.json({ ok: true, destination })
}

// DELETE — remove a custom RTMP destination
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const parsed = DeleteCustomRtmpSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Missing destination id" }, { status: 400 })
  }

  await prisma.customRtmpDestination.deleteMany({
    where: { id: parsed.data.id, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
