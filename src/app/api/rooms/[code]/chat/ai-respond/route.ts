import { NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { rateLimitGuard, getClientIp } from "@/lib/rate-limit"
import { getCachedRoom } from "@/lib/room-cache"
import { stripHtml } from "@/lib/sanitize"
import { publishChat, pollChat } from "@/lib/redis"
import { generateResponse } from "@/lib/gemini"

const RequestSchema = z.object({
  message: z
    .string()
    .min(1)
    .max(500)
    .transform((val) => stripHtml(val).trim()),
  author: z
    .string()
    .min(1)
    .max(100)
    .transform((val) => stripHtml(val).trim()),
  platform: z
    .string()
    .min(1)
    .max(20)
    .transform((val) => stripHtml(val).trim()),
  context: z
    .string()
    .max(500)
    .transform((val) => stripHtml(val).trim())
    .optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  // Only the authenticated host may trigger AI responses
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { code } = await params

  const blocked = await rateLimitGuard(getClientIp(req), "rooms:ai-respond")
  if (blocked) return blocked

  const room = await getCachedRoom(code)
  if (!room || room.hostId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 })
  }

  const { message, author, context } = parsed.data

  // Build system prompt
  const systemPrompt = [
    "You are a helpful AI assistant in a live stream chat.",
    "Keep responses concise (under 100 words).",
    "Be friendly, on-topic, and never offensive.",
    "Do not claim to be human. You are an AI helper for this stream.",
    context ? `Context about this stream: ${context}` : "",
  ]
    .filter(Boolean)
    .join(" ")

  // Fetch recent chat history for context (last 10 messages, oldest-first)
  const recentRaw = await pollChat(code, Date.now() - 10 * 60 * 1000).catch(() => [])
  const recentMessages = recentRaw.slice(-10) as Array<{
    platform?: string
    author?: { name?: string }
    message?: string
  }>

  const chatHistory = recentMessages
    .filter((m) => m.platform !== "ai") // never feed AI messages back as history
    .map((m) => ({
      role: ("host" === m.platform ? "model" : "user") as "user" | "model",
      text: `${m.author?.name ?? "Viewer"}: ${m.message ?? ""}`,
    }))

  // Generate response
  const responseText = await generateResponse(apiKey, systemPrompt, chatHistory, `${author}: ${message}`)

  if (!responseText) {
    return NextResponse.json({ error: "AI generation failed" }, { status: 502 })
  }

  // Publish AI message to room chat via Redis so all clients receive it
  const aiMessage = {
    id: crypto.randomUUID(),
    platform: "ai" as const,
    author: { name: "Zerocast AI" },
    message: responseText,
    timestamp: new Date().toISOString(),
    eventType: "text" as const,
  }

  await publishChat(code, aiMessage).catch((err) => {
    console.error("[ai-respond] publishChat failed:", err)
  })

  return NextResponse.json({ ok: true, response: responseText, messageId: aiMessage.id })
}
