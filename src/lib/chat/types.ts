// Re-export types from zod schemas for backward compatibility.
// All types are now derived from zod schemas in src/lib/schemas/.

export type { Platform } from "@/lib/schemas/platform"
export type { ChatMessage } from "@/lib/schemas/chat"
export type { SSEEventData } from "@/lib/schemas/sse"

// Re-export schemas for consumers that need runtime validation
export { PlatformSchema } from "@/lib/schemas/platform"
export { ChatMessageSchema } from "@/lib/schemas/chat"
export { SSEEventDataSchema } from "@/lib/schemas/sse"

// ── Connector health state ──────────────────────────────────────────────────
export type ConnectorStatus = "connecting" | "connected" | "reconnecting" | "failed"
