// ── Barrel export for all schemas and types ──────────────────────────────────

export {
  PlatformSchema,
  type Platform,
  PlatformConnectionSchema,
  type PlatformConnection,
  PlatformConnectRequestSchema,
  type PlatformConnectRequest,
  PlatformDisconnectRequestSchema,
  type PlatformDisconnectRequest,
  PlatformListResponseSchema,
  type PlatformListResponse,
} from "./platform"

export {
  CreateRoomRequestSchema,
  type CreateRoomRequest,
  CreateRoomResponseSchema,
  type CreateRoomResponse,
  RoomStatusSchema,
  type RoomStatus,
  RoomInfoSchema,
  type RoomInfo,
  OkResponseSchema,
  type OkResponse,
  ChatConnectResponseSchema,
  type ChatConnectResponse,
} from "./room"

export {
  GuestRequestSchema,
  type GuestRequest,
  GuestRequestResponseSchema,
  type GuestRequestResponse,
  AdmitGuestRequestSchema,
  type AdmitGuestRequest,
  DenyGuestRequestSchema,
  type DenyGuestRequest,
  LeaveRequestSchema,
  type LeaveRequest,
} from "./guest"

export {
  ChatAuthorSchema,
  type ChatAuthor,
  ChatMessageSchema,
  type ChatMessage,
} from "./chat"

export {
  SSEChatMessageEventSchema,
  SSEGuestRequestEventSchema,
  SSEGuestAdmittedEventSchema,
  SSEGuestDeniedEventSchema,
  SSEGuestLeftEventSchema,
  SSEStudioEndedEventSchema,
  SSEPingEventSchema,
  SSEConnectionErrorEventSchema,
  SSEEventDataSchema,
  type SSEEventData,
} from "./sse"

export {
  ApiResponseSchema,
  type ApiResponse,
  ApiErrorResponseSchema,
  type ApiErrorResponse,
  validateRequestBody,
} from "./api"
