# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (port 3000)
npm run build        # Runs `prisma migrate deploy && next build` — touches the DB
npm run lint         # ESLint (next/core-web-vitals + next/typescript)
npm test             # Vitest, single run (~184 tests)
npm run test:watch
npm run test:coverage

# Run a single test file
npx vitest run src/__tests__/schemas/room.test.ts

# Run tests by name pattern
npx vitest run -t "auto-admits"

# Prisma
npx prisma migrate dev --name <name>   # create + apply migration in dev
npx prisma migrate deploy              # apply migrations (used in build)
npx prisma studio                      # DB inspector

# Local stack (no cloud accounts needed)
docker compose up --build              # postgres + redis + SRH proxy + livekit + app
docker compose down -v                 # wipe volumes too

# Helper scripts
node scripts/create-demo-room.mjs      # seed a demo room
node scripts/provision-upstash.mjs     # provision Upstash resources
```

When the app boots without `GOOGLE_CLIENT_ID`, the login page exposes a **"Continue as Test User"** button — useful for local dev.

## Architecture

Browser-based streaming studio. WebRTC via LiveKit (SFU) for audio/video. Multi-platform RTMP egress to YouTube/Twitch/Kick/TikTok. Real-time events over **LiveKit data channels** with **Upstash Redis as event bus + chat relay** (SSE used in older paths; v1.9 migrated most of it).

```
Browser ──WebRTC──▶ LiveKit SFU ──RTMP──▶ YouTube / Twitch / Kick / TikTok
   │                     │
   ▼                     ▼
Next.js API ◄──────▶ Upstash Redis (events, chat relay, rate limit, cache)
   │
   ▼
Neon Postgres (Prisma)
```

### Layout

- `src/app/api/rooms/[code]/` — per-room actions (admit, deny, kick, mute, stream, chat/{connect,send,ai-respond,guest-send}, stream-live, end, leave, state, events-since, record, platforms).
- `src/app/api/platforms/`, `/api/feedback/`, `/api/status/`, `/api/beta/`, `/api/auth/`.
- `src/app/(marketing)/` — public marketing pages (route group, no layout pollution).
- `src/app/studio/[code]/` host UI · `src/app/join/[code]/` guest preview→request→studio · `src/app/demo/[code]/` no-auth demo · `dashboard/`, `settings/platforms/`, `session-summary/`, `status/`, `qa/`.
- `src/lib/livekit.ts` — server SDK (token mint, room svc, mute, kick, `sendDataToParticipant`). `toJwt()` is **async** in v2.x — must be awaited (silent disconnects otherwise).
- `src/lib/redis.ts` — lazy singleton (Proxy) so build doesn't fail on placeholder env. Per-room keys tracked in a Set under `room:<code>:_keys` for cleanup. Helpers: `setRoomInfo/getRoomInfo`, `setPendingGuest/setApprovedGuest`, `publishEvent/publishChat`, `pollEvents/pollChat`, `deleteRoomKeys`.
- `src/lib/prisma.ts` — retry wrapper around Prisma. Retries on `P1001/P1002/P1008/P1017` and `Can't reach database server`, 3 attempts, exponential backoff (Neon free-tier cold-start resilient). Appends `connection_limit=1` for serverless.
- `src/lib/rate-limit.ts` — Upstash sliding-window limiters (22 endpoint types in `LIMITER_CONFIGS`). **Fail-open** by design (Redis outage ≠ blocked users). Use `rateLimitGuard()` or `checkRateLimit()` + manual 429.
- `src/lib/sanitize.ts` — `stripHtml()` for all user input. Applied via Zod transforms in `src/lib/schemas/`.
- `src/lib/schemas/` — Zod schemas + `validateRequestBody()` helper. Add new request types here; the barrel `index.ts` re-exports.
- `src/lib/chat/` — platform connectors (`youtube`, `twitch` via tmi.js, `kick`, `tiktok`) coordinated by `manager.ts`.
- `src/lib/egress.ts` — LiveKit RTMP egress (`POST /api/rooms/[code]/stream-live`).
- `src/lib/gemini.ts` — AI chat responder. Disabled server-side when `GEMINI_API_KEY` absent.
- `src/lib/room-cache.ts` — Redis-backed room cache (warm/get/invalidate) to dodge cold Neon hits.
- `src/store/` — Zustand stores (`studio.ts` layout/streaming state, `chat.ts`).
- `src/auth.ts` (full, used in API routes / server components) vs `src/auth.config.ts` (edge-safe, used by `src/middleware.ts`). **JWT session strategy is required** — DB sessions break the Edge middleware (infinite redirect to `/login`).
- `src/middleware.ts` matcher excludes `/api`, `_next`, `favicon.ico`. API routes do their own `auth()` checks.

### Data model essentials (`prisma/schema.prisma`)

`User → PlatformConnection (1:1 per platform via @@unique([userId, platform])) | CustomRtmpDestination | Room`. `Room → Participant | StreamSession | GuestLead`. Enums: `RoomStatus {LOBBY, LIVE, ENDED}`, `PlatformType {YOUTUBE, TWITCH, KICK, TIKTOK}`, `StreamStatus`, `ParticipantRole`. `PlatformConnection.streamKey`, `ingestUrl`, `backupIngestUrl` (YouTube secondary) — stored plain, rely on Neon at-rest encryption.

### Auth & identity

- LiveKit identity strings are `host-<userId>` / `guest-<guestId>` — referenced everywhere (mute/kick/sendData target these).
- Session-based auth (NextAuth JWT) for HTTP routes; LiveKit JWT (minted server-side in `lib/livekit.ts`) for the SFU connection.

### Tests

- Vitest, `environment: "node"`, alias `@/* → src/*`.
- `vitest.setup.ts` mocks Redis, Prisma, NextAuth `auth()`, LiveKit server SDK, room cache, and rate limiter — write new tests assuming those mocks. Override per-test with `vi.mocked(...)`.
- Coverage is scoped to `src/store/**` and `src/lib/schemas/**` only.

### Security headers & CSP

`next.config.ts` sets CSP, `X-Frame-Options: DENY`, `Referrer-Policy`. `connect-src` allows `https:` and `wss:` (needed for LiveKit + Upstash REST). Script CSP currently allows `'unsafe-inline' 'unsafe-eval'` — be aware before tightening.

## Conventions / gotchas

- **Don't await `toJwt()` synchronously** — it's async in `livekit-server-sdk` v2.x.
- **Don't switch NextAuth to DB sessions.** Edge middleware can't read them; auth loop will result.
- **Validate request bodies via `validateRequestBody(Schema, body)`** — returns `{ success, data | response }`. Use the returned NextResponse on failure rather than crafting your own.
- **Sanitize at the schema boundary**, not in handlers. New string inputs that hit the DB or chat relay should pass through `stripHtml()` via a Zod transform.
- **Rate limiters fail open** — don't add fallback "deny if Redis dead" logic; that defeats the design intent.
- **Redis keys must be tracked** in `room:<code>:_keys` if they should be cleaned on room end. Use the existing helpers; don't write raw keys ad hoc.
- **PlatformType is uppercase** in the DB enum; user input is normalized via `.toUpperCase()` before insertion.
- **LiveKit room limits**: `emptyTimeout: 300s`, `maxParticipants: 6` (set in `createLivekitRoom`). Tune both together if changing.
- **Prisma connection limit**: `?connection_limit=1` is force-appended for serverless — don't strip it.
- **Marketing pages live under `src/app/(marketing)/`** (route group) — they bypass the authed layout.

## External docs

- `docs/architecture-audit.md`, `docs/audit-v1.8.0.md`, `docs/frontend-performance-audit.md`, `docs/qa-test-plan.md`, `docs/orchestration-plan.md` — historical context for prior audits / migrations.
- `docs/zerocast-api.postman_collection.json` — API collection.
- Changelog: `src/app/changelog/page.tsx` (current: **v2.0.0**, Phase 4 hardening — rate limiting + sanitization).
