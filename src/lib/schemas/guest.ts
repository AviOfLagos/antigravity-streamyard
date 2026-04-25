import { z } from "zod"

import { stripHtml } from "@/lib/sanitize"

// ── Guest join request (POST /api/rooms/[code]/request) ──────────────────────

export const GuestRequestSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .transform((val) => stripHtml(val).trim().slice(0, 50))
    .pipe(z.string().min(1, "Name is required after sanitization")),
  email: z
    .string()
    .email("Invalid email address")
    .transform((val) => val.trim().toLowerCase().slice(0, 200))
    .optional(),
})
export type GuestRequest = z.infer<typeof GuestRequestSchema>

// ── Guest request response ───────────────────────────────────────────────────

export const GuestRequestResponseSchema = z.object({
  guestId: z.string(),
  autoAdmitted: z.boolean().optional(),
})
export type GuestRequestResponse = z.infer<typeof GuestRequestResponseSchema>

// ── Admit guest request (POST /api/rooms/[code]/admit) ───────────────────────

export const AdmitGuestRequestSchema = z.object({
  guestId: z.string().min(1, "guestId is required"),
  name: z.string().optional(),
})
export type AdmitGuestRequest = z.infer<typeof AdmitGuestRequestSchema>

// ── Deny guest request (POST /api/rooms/[code]/deny) ─────────────────────────

export const DenyGuestRequestSchema = z.object({
  guestId: z.string().min(1, "guestId is required"),
})
export type DenyGuestRequest = z.infer<typeof DenyGuestRequestSchema>

// ── Leave request (POST /api/rooms/[code]/leave) ─────────────────────────────

export const LeaveRequestSchema = z.object({
  displayName: z.string().optional(),
  identity: z.string().optional(),
})
export type LeaveRequest = z.infer<typeof LeaveRequestSchema>
