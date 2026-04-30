// Gemini 2.0 Flash — free tier: 15 RPM, 1500 RPD, 1M TPM
// No SDK needed; use fetch() against the REST endpoint.

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

interface GeminiPart {
  text: string
}

interface GeminiContent {
  role: "user" | "model"
  parts: GeminiPart[]
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: GeminiPart[]
    }
  }[]
  error?: { message: string }
}

/**
 * Generate a chat reply using Gemini 2.0 Flash.
 *
 * @param apiKey       - GEMINI_API_KEY from environment
 * @param systemPrompt - Personality / context injected as the first user turn
 * @param chatHistory  - Last N messages for conversational context
 * @param userMessage  - The viewer's question to answer
 * @returns The generated text, or null if the call fails / produces no output
 */
export async function generateResponse(
  apiKey: string,
  systemPrompt: string,
  chatHistory: { role: "user" | "model"; text: string }[],
  userMessage: string,
): Promise<string | null> {
  // Build the contents array: system prompt as first user turn (Gemini Flash
  // doesn't have a dedicated system role in the free REST endpoint), then
  // history, then the new question.
  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    // Acknowledge system prompt as model so history alternates correctly
    {
      role: "model",
      parts: [{ text: "Understood. I will follow those instructions." }],
    },
    ...chatHistory.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: "user",
      parts: [{ text: userMessage }],
    },
  ]

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 150,   // ~100 words max to keep responses concise
          temperature: 0.7,
          topP: 0.9,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT",        threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH",       threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText)
      console.error(`[Gemini] HTTP ${res.status}: ${errText}`)
      return null
    }

    const data = (await res.json()) as GeminiResponse

    if (data.error) {
      console.error(`[Gemini] API error: ${data.error.message}`)
      return null
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return text ?? null
  } catch (err) {
    console.error("[Gemini] fetch failed:", err)
    return null
  }
}
