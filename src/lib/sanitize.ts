// ── HTML sanitization utilities ─────────────────────────────────────────────

/**
 * Common HTML entity map for decoding.
 */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&#x27;": "'",
  "&#x2F;": "/",
  "&#47;": "/",
}

/**
 * Strip all HTML tags from a string, decode common HTML entities,
 * and preserve emoji + international (non-ASCII) characters.
 *
 * Does NOT double-encode already-clean strings.
 */
export function stripHtml(input: string): string {
  // Remove all HTML tags (including self-closing and with attributes)
  let result = input.replace(/<[^>]*>/g, "")

  // Decode common HTML entities
  result = result.replace(
    /&(?:amp|lt|gt|quot|apos|#39|#x27|#x2F|#47);/gi,
    (match) => HTML_ENTITIES[match.toLowerCase()] ?? match,
  )

  return result
}
