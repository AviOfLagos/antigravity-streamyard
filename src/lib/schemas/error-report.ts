import { z } from "zod"
import { stripHtml } from "../sanitize"

/* Client-side error report payload. POST /api/errors. */

export const ErrorReportSchema = z.object({
  message: z.string().min(1).max(2000).transform((s) => stripHtml(s)),
  stack: z
    .string()
    .max(20_000)
    .transform((s) => stripHtml(s))
    .optional(),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  level: z.enum(["error", "warn"]).default("error"),
  context: z.record(z.string(), z.unknown()).optional(),
})

export type ErrorReport = z.infer<typeof ErrorReportSchema>
