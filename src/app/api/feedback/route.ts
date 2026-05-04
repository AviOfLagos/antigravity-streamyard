import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { redis } from "@/lib/redis"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { stripHtml } from "@/lib/sanitize"

const FEEDBACK_TTL = 60 * 60 * 24 * 90 // 90 days

const FeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "other"]),
  title: z
    .string()
    .min(1, "Title is required")
    .max(200)
    .transform((val) => stripHtml(val).trim()),
  description: z
    .string()
    .min(1, "Description is required")
    .max(5000)
    .transform((val) => stripHtml(val).trim()),
  email: z
    .string()
    .email()
    .max(200)
    .transform((val) => val.trim().toLowerCase())
    .optional()
    .or(z.literal("")),
})

export async function POST(req: NextRequest) {
  const blocked = await rateLimitGuard(getClientIp(req), "feedback:submit")
  if (blocked) return blocked

  const body = await req.json().catch(() => ({}))
  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const { type, title, description, email } = parsed.data

  const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const feedback = {
    id: feedbackId,
    type,
    title,
    description,
    email: email || null,
    createdAt: new Date().toISOString(),
    ip: getClientIp(req),
  }

  try {
    await redis.lpush("zerocast:feedback", JSON.stringify(feedback))
    await redis.ltrim("zerocast:feedback", 0, 999)
    await redis.expire("zerocast:feedback", FEEDBACK_TTL)

    return NextResponse.json({ ok: true, id: feedbackId })
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
