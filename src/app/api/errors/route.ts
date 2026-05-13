import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { recordError } from "@/lib/errors"
import { getClientIp, rateLimitGuard } from "@/lib/rate-limit"
import { ErrorReportSchema } from "@/lib/schemas/error-report"
import { validateRequestBody } from "@/lib/schemas/api"

export async function POST(req: NextRequest) {
  const limited = await rateLimitGuard(getClientIp(req), "errors:ingest")
  if (limited) return limited

  const body = await req.json().catch(() => null)
  const validation = validateRequestBody(ErrorReportSchema, body)
  if (!validation.success) return validation.response

  const session = await auth().catch(() => null)

  await recordError({
    side: "client",
    level: validation.data.level,
    message: validation.data.message,
    stack: validation.data.stack,
    url: validation.data.url,
    userAgent: validation.data.userAgent,
    email: session?.user?.email ?? undefined,
    context: validation.data.context,
  })

  return NextResponse.json({ ok: true })
}
