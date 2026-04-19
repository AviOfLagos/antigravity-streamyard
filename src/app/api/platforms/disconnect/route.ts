import { PlatformType } from "@prisma/client"
import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlatformDisconnectRequestSchema } from "@/lib/schemas"
import { validateRequestBody } from "@/lib/schemas/api"

// Map lowercase platform names to Prisma PlatformType enum
const toPrismaPlat = (p: string): PlatformType =>
  PlatformType[p.toUpperCase() as keyof typeof PlatformType]

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const validation = validateRequestBody(PlatformDisconnectRequestSchema, body)
  if (!validation.success) return validation.response

  const { platform } = validation.data

  await prisma.platformConnection.deleteMany({
    where: { userId: session.user.id, platform: toPrismaPlat(platform) },
  })

  return NextResponse.json({ ok: true })
}
