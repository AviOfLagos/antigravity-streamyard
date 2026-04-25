import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

const FEEDBACK_TTL = 60 * 60 * 24 * 90 // 90 days

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, title, description, email } = body as {
      type?: string
      title?: string
      description?: string
      email?: string
    }

    if (!type || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["bug", "feature", "other"].includes(type)) {
      return NextResponse.json({ error: "Invalid feedback type" }, { status: 400 })
    }

    const feedbackId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const feedback = {
      id: feedbackId,
      type,
      title: title.trim().slice(0, 200),
      description: description.trim().slice(0, 5000),
      email: email?.trim().slice(0, 200) || null,
      createdAt: new Date().toISOString(),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
    }

    // Store in Redis list
    await redis.lpush("zerocast:feedback", JSON.stringify(feedback))
    await redis.ltrim("zerocast:feedback", 0, 999) // Keep last 1000
    await redis.expire("zerocast:feedback", FEEDBACK_TTL)

    return NextResponse.json({ ok: true, id: feedbackId })
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}
