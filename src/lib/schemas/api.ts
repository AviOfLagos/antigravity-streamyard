import { z, type ZodType } from "zod"
import { NextResponse } from "next/server"

// ── API response wrapper ─────────────────────────────────────────────────────

export function ApiResponseSchema<T extends ZodType>(dataSchema: T) {
  return z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  })
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// ── API error response ───────────────────────────────────────────────────────

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
})
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>

// ── Validation helper for API routes ─────────────────────────────────────────

/**
 * Validates a request body with the given schema.
 * Returns the parsed data on success, or a NextResponse with 400 on failure.
 */
export function validateRequestBody<T>(
  schema: ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data)
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    }
  }
  return { success: true, data: result.data }
}
