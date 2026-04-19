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
  StreamKeyRequestSchema,
  type StreamKeyRequest,
} from "./platform"

export {
  RoomCodeSchema,
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
  SSEPlatformTokenExpiredEventSchema,
  SSEChatConnectorStatusEventSchema,
  SSEStreamStartedEventSchema,
  SSEStreamStoppedEventSchema,
  SSEStreamDestinationChangedEventSchema,
  SSEStreamErrorEventSchema,
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
