import { vi } from "vitest"

// Mock env vars
process.env.UPSTASH_REDIS_REST_URL = "http://localhost:8079"
process.env.UPSTASH_REDIS_REST_TOKEN = "test-token"
process.env.LIVEKIT_API_KEY = "test-key"
process.env.LIVEKIT_API_SECRET = "test-secret"
process.env.NEXT_PUBLIC_LIVEKIT_URL = "ws://localhost:7880"
process.env.DATABASE_URL = "postgresql://test@localhost/test"
process.env.DIRECT_URL = "postgresql://test@localhost/test"
process.env.NEXTAUTH_SECRET = "test-secret-32-chars-minimum-here"

// Mock Redis
vi.mock("@/lib/redis", () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    lpush: vi.fn(),
    ltrim: vi.fn(),
    lrange: vi.fn(() => []),
    expire: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    sismember: vi.fn(() => 0),
    keys: vi.fn(() => []),
    ping: vi.fn(() => "PONG"),
    llen: vi.fn(() => 0),
    exists: vi.fn(() => 1),
  },
  publishEvent: vi.fn(),
  publishChat: vi.fn(),
  setPendingGuest: vi.fn(),
  deletePendingGuest: vi.fn(),
  setApprovedGuest: vi.fn(),
  setRoomInfo: vi.fn(),
  getRoomInfo: vi.fn(),
  deleteRoomKeys: vi.fn(),
  saveStudioState: vi.fn(),
  loadStudioState: vi.fn(),
  pollEvents: vi.fn(() => []),
  pollChat: vi.fn(() => []),
}))

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(() => []),
      update: vi.fn(),
      updateMany: vi.fn(() => ({ count: 1 })),
    },
    participant: {
      create: vi.fn(),
      updateMany: vi.fn(() => ({ count: 1 })),
      findMany: vi.fn(() => []),
    },
    guestLead: {
      create: vi.fn(),
    },
    platformConnection: {
      findMany: vi.fn(() => []),
    },
    streamSession: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => null),
}))

// Mock LiveKit
vi.mock("@/lib/livekit", () => ({
  createLivekitRoom: vi.fn(),
  closeLivekitRoom: vi.fn(),
  generateHostToken: vi.fn(async () => "mock-host-token"),
  generateParticipantToken: vi.fn(async () => "mock-guest-token"),
  getParticipantCount: vi.fn(async () => 1),
  removeParticipant: vi.fn(),
  muteParticipantTrack: vi.fn(),
  listParticipants: vi.fn(async () => []),
}))

// Mock room cache
vi.mock("@/lib/room-cache", () => ({
  getCachedRoom: vi.fn(),
  invalidateRoomCache: vi.fn(),
  warmRoomCache: vi.fn(),
}))

// Mock rate limit
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ success: true, limit: 5, remaining: 4, reset: Date.now() + 60000 })),
  getClientIp: vi.fn(() => "127.0.0.1"),
}))
