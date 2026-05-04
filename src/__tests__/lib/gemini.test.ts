import { describe, it, expect, vi, beforeEach } from "vitest"
import { generateResponse } from "@/lib/gemini"

describe("generateResponse", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns text on successful response", async () => {
    const mockResponse = {
      candidates: [
        {
          content: {
            parts: [{ text: "This is a great question! The answer is 42." }],
          },
        },
      ],
    }

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await generateResponse(
      "test-api-key",
      "You are a helpful assistant.",
      [],
      "What is the answer?"
    )

    expect(result).toBe("This is a great question! The answer is 42.")
  })

  it("returns null on HTTP error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
      text: async () => "Rate limit exceeded",
    } as Response)

    const result = await generateResponse("key", "prompt", [], "question")
    expect(result).toBeNull()
  })

  it("returns null on API error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "Invalid API key" } }),
    } as Response)

    const result = await generateResponse("bad-key", "prompt", [], "question")
    expect(result).toBeNull()
  })

  it("returns null on empty candidates", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ candidates: [] }),
    } as Response)

    const result = await generateResponse("key", "prompt", [], "question")
    expect(result).toBeNull()
  })

  it("returns null on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"))

    const result = await generateResponse("key", "prompt", [], "question")
    expect(result).toBeNull()
  })

  it("includes system prompt and chat history in request", async () => {
    let capturedBody: any = null
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "Reply" }] } }] }),
      } as Response
    })

    await generateResponse(
      "key",
      "Be concise.",
      [
        { role: "user", text: "Hi" },
        { role: "model", text: "Hello!" },
      ],
      "What time is it?"
    )

    expect(capturedBody.contents).toHaveLength(5) // system + ack + 2 history + question
    expect(capturedBody.contents[0].parts[0].text).toBe("Be concise.")
    expect(capturedBody.contents[2].parts[0].text).toBe("Hi")
    expect(capturedBody.contents[3].parts[0].text).toBe("Hello!")
    expect(capturedBody.contents[4].parts[0].text).toBe("What time is it?")
  })

  it("uses correct API URL with key", async () => {
    let capturedUrl: string = ""
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (url) => {
      capturedUrl = url as string
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
      } as Response
    })

    await generateResponse("my-api-key", "prompt", [], "question")
    expect(capturedUrl).toContain("key=my-api-key")
    expect(capturedUrl).toContain("gemini-2.0-flash")
  })

  it("sets maxOutputTokens to 150", async () => {
    let capturedBody: any = null
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
      } as Response
    })

    await generateResponse("key", "prompt", [], "question")
    expect(capturedBody.generationConfig.maxOutputTokens).toBe(150)
  })

  it("includes safety settings", async () => {
    let capturedBody: any = null
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(async (_url, init) => {
      capturedBody = JSON.parse(init?.body as string)
      return {
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
      } as Response
    })

    await generateResponse("key", "prompt", [], "question")
    expect(capturedBody.safetySettings).toHaveLength(4)
    expect(capturedBody.safetySettings[0].category).toBe("HARM_CATEGORY_HARASSMENT")
  })
})
