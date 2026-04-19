# Zerocast Architecture Audit

**Date:** 2026-04-19
**Auditor:** Claude (Senior Streaming Engineer)

---

## What Zerocast Is

Zerocast is a browser-based live streaming studio (StreamYard clone). The core loop:

1. Host creates a studio room, gets a shareable link
2. Guests "knock" on the door, host admits/denies from a backstage queue
3. Everyone appears in a WebRTC video grid (via LiveKit) with layout presets
4. Chat messages from YouTube, Twitch, Kick, and TikTok are aggregated into a single feed
5. After the session, a summary page shows duration, participant count, message stats

## Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Framework | Next.js | 15.5.15 |
| Runtime | React 19 | 19.1.0 |
| Real-time Video | LiveKit | 2.15.1 (server), 2.9.20 (React) |
| Auth | NextAuth.js v5 | 5.0.0-beta.31 |
| Database | PostgreSQL (Neon) | Prisma 6.19.3 |
| Cache/Events | Upstash Redis | 1.37.0 |
| State | Zustand | 5.0.12 |
| UI | shadcn/ui + Radix + Tailwind v4 | - |
| Chat: Twitch | tmi.js | 1.8.5 |
| Chat: Kick | Pusher.js | 8.5.0 |
| Chat: TikTok | tiktok-live-connector | 2.1.1-beta1 |
| Chat: YouTube | YouTube Data API v3 | fetch |

## Schema (Current)

```
User → Account, Session, PlatformConnection[], Room[]
Room → code (unique), title, hostId, status, selectedPlatforms[]
PlatformConnection → userId, platform, channelId, accessToken, refreshToken, expiresAt
```

## What's Done Well

- **Backstage/admission model** — proper host control before guests go live
- **SSE over Redis** — pragmatic for serverless, avoids WebSocket server complexity
- **Graceful degradation** — TikTok failures don't crash studio, Promise.allSettled for stats
- **JWT session strategy** — correct for Edge middleware compatibility
- **Room codes** — 6-char alphanumeric instead of UUIDs for invite links
- **Idempotent endpoints** — /end and /leave safe to call multiple times

## Critical Gaps

### 1. No RTMP Streaming Output (BLOCKING)
The studio doesn't actually stream anywhere. LiveKit Egress supports RTMP push but isn't wired up. Currently this is a video call with chat, not a streaming tool.

### 2. Schema Too Thin
- `selectedPlatforms: String[]` — no validation, should be enum or relation
- No `Participant` model — guest history lost when Redis expires
- No `ChatMessage` model — everything in Redis with 500-cap, 24h TTL
- No `StreamSession` model — no per-platform broadcast state tracking

### 3. No OAuth Token Refresh
PlatformConnection stores tokens with expiresAt but no refresh logic. YouTube tokens expire in 1 hour → chat silently fails.

### 4. No Type Safety at API Boundaries
Raw `NextResponse.json()` with no shared types. Client/server have no contract. Should use zod schemas or tRPC.

### 5. Chat Polling is Wasteful
SSE polls Redis every 1s. YouTube connector polls every 20s. Double-poll with 5s lookback produces duplicates under load.

### 6. No Recording
LiveKit Egress supports room compositing to S3/GCS — low-hanging fruit.

### 7. No Rate Limiting
Anyone can spam `/api/rooms/[code]/request` to flood backstage queue.

### 8. No State Persistence
Zustand stores reset on browser refresh — layout, pending guests, chat filters all lost.

### 9. No Multi-Destination Controls
selectedPlatforms exists but no UI/API to start/stop streaming per platform.

### 10. No Abuse Protection
No captcha, no IP throttling on public endpoints.

## Frontend Performance Issues

See separate section in performance audit.

## Priority Roadmap

1. RTMP Egress via LiveKit
2. Shared type contracts (zod)
3. OAuth token refresh
4. Participant + StreamSession models
5. Recording support
6. Rate limiting on public endpoints
7. Redis pub/sub instead of polling
