# Zerocast — Orchestration Plan

**Date:** 2026-04-19
**Lead:** Claude (Architect / Orchestrator)
**Phase:** Studio Experience (RTMP egress deferred)
**Budget:** $0 (Neon free, Upstash free, Vercel free, LiveKit Cloud free tier)

---

## Agent Team

| Agent ID | Codename | Specialty | Owns |
|----------|----------|-----------|------|
| `PERF` | Render | Frontend performance — React optimization, code splitting, virtualization | F-01 through F-04 |
| `TYPES` | Contract | Type safety — zod schemas, shared API contracts, end-to-end typing | F-05 |
| `DATA` | Schema | Data layer — Prisma models, migrations, Redis structure, queries | F-06 |
| `AUTH` | Gatekeeper | Auth & platform OAuth — token refresh, session management, connections | F-07, F-08 |
| `CHAT` | Relay | Chat system — connectors, deduplication, delivery pipeline | F-09, F-10 |
| `STUDIO` | Stage | Studio UX — state persistence, error boundaries, host/guest flows | F-11, F-12, F-13 |
| `SHIELD` | Guard | Security — rate limiting, input validation, abuse protection | F-14, F-15 |

---

## Dependency Graph

```
F-05 (Types) ──────┐
F-06 (Schema) ─────┤
                    ├──▶ F-01..F-04 (Perf) ──▶ F-11..F-13 (Studio UX)
F-07 (Auth) ───────┤                                │
F-08 (Platforms) ──┤                                ▼
                    ├──▶ F-09..F-10 (Chat) ──▶ F-14..F-15 (Security)
                    │
                    └──▶ All agents can start research immediately;
                         implementation follows this order.
```

**Phase 1 — Foundation (no dependencies):** F-05, F-06
**Phase 2 — Core systems (depends on Phase 1):** F-01..F-04, F-07, F-08
**Phase 3 — Features (depends on Phase 2):** F-09, F-10, F-11, F-12, F-13
**Phase 4 — Hardening (depends on Phase 3):** F-14, F-15

---

## Feature Specifications

---

### F-01: Zustand Selector Optimization
**Agent:** PERF (Render)
**Priority:** Critical
**Depends on:** None (can start immediately)

**Problem:** Components subscribe to entire store objects. Any store change re-renders VideoGrid, BackstagePanel, ChatPanel, and GuestRequestToast simultaneously.

**User Flow:** N/A (internal optimization, no UX change)

**Implementation:**
1. Refactor `useStudioStore()` calls to use individual selectors:
   ```ts
   const layout = useStudioStore((s) => s.activeLayout)
   ```
2. Add `useShallow` from `zustand/shallow` for multi-value selectors where needed
3. Remove legacy `onScreen`, `toggleOnScreen`, `setOnScreen` from store (dead code)
4. Move `filteredMessages()` from store method to a `useMemo` in ChatPanel

**Files to modify:**
- `src/store/studio.ts` — remove legacy props, keep interface clean
- `src/store/chat.ts` — remove `filteredMessages` from store
- `src/components/studio/VideoGrid.tsx:31` — individual selectors
- `src/components/studio/BackstagePanel.tsx:73` — individual selector
- `src/components/studio/GuestRequestToast.tsx:16` — individual selectors
- `src/components/chat/ChatPanel.tsx:19` — replace with `useMemo` + selectors

**Acceptance Criteria:**
- [ ] No component re-renders when unrelated store slice changes (verify with React DevTools Profiler)
- [ ] Legacy `onScreen` / `toggleOnScreen` / `setOnScreen` removed
- [ ] `filteredMessages` computed via `useMemo`, not store method
- [ ] All existing studio functionality works unchanged

**Edge Cases:**
- Ensure `useShallow` is only used when selecting objects/arrays (not primitives)
- `filteredMessages` must recompute when either `messages` or `filters` change
- Removing legacy props must not break any other import (grep for all `onScreen` usage first)

---

### F-02: React.memo & Component Memoization
**Agent:** PERF (Render)
**Priority:** Critical
**Depends on:** F-01 (selectors must be in place first)

**Problem:** List-item components re-render on every parent change. With 6 video tiles and 500 chat messages, this is expensive.

**Implementation:**
1. Wrap `VideoTile` with `React.memo`
2. Wrap `ChatMessage` with `React.memo` (compare by `msg.id`)
3. Extract `ParticipantRow` in BackstagePanel to its own file, wrap with `React.memo`
4. Add `useMemo` to VideoGrid track filtering (`VideoGrid.tsx:34-42`)
5. Memoize `handleSSEEvent` properly — use stable refs instead of recreating

**Files to modify:**
- `src/components/studio/VideoTile.tsx` — wrap export with `React.memo`
- `src/components/chat/ChatMessage.tsx` — wrap export, custom comparator on `msg.id`
- `src/components/studio/BackstagePanel.tsx` — extract `ParticipantRow`
- `src/components/studio/VideoGrid.tsx:34-42` — `useMemo` for filter chains

**Acceptance Criteria:**
- [ ] VideoTile only re-renders when its own props change
- [ ] ChatMessage only re-renders when `msg.id` changes
- [ ] VideoGrid filter chains memoized — runs only when `tracks` or store values change
- [ ] No visual regressions in grid, spotlight, or screen-only layouts

**Edge Cases:**
- `React.memo` comparators must not be too aggressive — track source changes (camera vs screenshare) must trigger re-render
- Ensure memoization doesn't prevent participant name/avatar updates from LiveKit metadata

---

### F-03: SSE Connection & Render Churn Fix
**Agent:** PERF (Render)
**Priority:** Critical
**Depends on:** None

**Problem:** SSE PING every 1s calls `setSseOk(true)` even when already true, re-rendering entire StudioClient tree. EventSource leaks on dependency changes.

**User Flow:** N/A (internal fix)

**Implementation:**
1. Fix `setSseOk` to only update on state change:
   ```ts
   setSseOk((prev) => { if (prev) return prev; return true })
   ```
2. Use `useRef` for EventSource instance, close previous before creating new
3. Move `handleSSEEvent` to a ref-based callback pattern (stable identity)
4. Filter PING events before triggering any state updates
5. Only call `addMessage` / `addPendingGuest` when data is actually new (dedup by `_ts`)

**Files to modify:**
- `src/components/studio/StudioClient.tsx` (or wherever SSE is handled — the file may have been renamed; search for `EventSource` usage)

**Acceptance Criteria:**
- [ ] Studio page does NOT re-render every second when idle
- [ ] SSE reconnects cleanly after network interruption
- [ ] No duplicate EventSource connections on component re-render
- [ ] PING events do not trigger React state updates
- [ ] Browser DevTools Network tab shows exactly 1 SSE connection at a time

**Edge Cases:**
- Tab backgrounding: browsers throttle timers in background tabs. SSE may fall behind. On tab focus, must not replay stale events.
- Network disconnect > 30s: accumulated events in Redis may exceed lookback window. Must update `lastEventTs` ref on reconnect.
- Strict Mode double-mount: React 19 in dev mode mounts effects twice. EventSource must handle this without leaking.

---

### F-04: Code Splitting & Bundle Optimization
**Agent:** PERF (Render)
**Priority:** High
**Depends on:** None

**Problem:** LiveKit bundle (~400KB) loaded on all pages. LiveKit CSS imported globally in root layout.

**User Flow:** N/A (load time improvement)

**Implementation:**
1. Move `@livekit/components-styles` import from `layout.tsx` to a studio-only layout or dynamic import
2. Dynamic import `StudioClient` in studio page:
   ```ts
   const StudioClient = dynamic(() => import("@/components/studio/StudioClient"), {
     ssr: false,
     loading: () => <StudioSkeleton />
   })
   ```
3. Add `<Suspense>` boundary around studio page content
4. Add `<Suspense>` boundary around dashboard data sections
5. Parallelize dashboard DB queries with `Promise.all`
6. Add Error Boundary wrapping StudioClient with fallback UI
7. Move platform data fetch from client `useEffect` to server component props

**Files to modify:**
- `src/app/layout.tsx:4` — remove LiveKit styles import
- `src/app/studio/[code]/page.tsx` — dynamic import, Suspense, server-side platform fetch
- `src/app/studio/[code]/layout.tsx` — create if needed, import LiveKit styles here
- `src/app/dashboard/page.tsx` — Suspense + Promise.all for queries
- `src/components/studio/StudioClient.tsx` — accept `connectedPlatforms` as prop instead of fetching

**Acceptance Criteria:**
- [ ] Landing page bundle does NOT include LiveKit code (verify with `next build --analyze` or bundle inspector)
- [ ] Studio page shows skeleton/loading state while LiveKit loads
- [ ] Dashboard renders incrementally (rooms appear as they load)
- [ ] Error boundary catches LiveKit failures and shows recovery UI
- [ ] Platform data available immediately (no loading flash in studio)

**Edge Cases:**
- Dynamic import may flash briefly on fast connections — skeleton must be styled to match final layout dimensions to avoid CLS
- Error boundary must offer "Rejoin" action, not just "Something went wrong"
- `ssr: false` means studio is client-only — ensure no hydration mismatch warnings

---

### F-05: Shared Type Contracts (Zod Schemas)
**Agent:** TYPES (Contract)
**Priority:** Critical
**Depends on:** None (foundation work)

**Problem:** API routes return untyped JSON. Client fetches parse responses with blind `as` casts or no validation. No compile-time contract between server and client.

**User Flow:** N/A (developer experience)

**Implementation:**
1. Create `src/lib/schemas/` directory:
   - `room.ts` — room creation request/response, room info
   - `guest.ts` — guest request, admit, deny payloads
   - `platform.ts` — platform connection, platform enum
   - `chat.ts` — chat message schema (replaces current interface)
   - `sse.ts` — SSE event discriminated union
   - `api.ts` — shared API response wrapper `{ success, data?, error? }`
2. Use zod for runtime validation + type inference (`z.infer<typeof schema>`)
3. Replace all `NextResponse.json()` calls with typed response helpers
4. Replace all client-side `fetch` + `as` casts with schema validation
5. Create shared `Platform` enum: `z.enum(["youtube", "twitch", "kick", "tiktok"])`

**Files to create:**
- `src/lib/schemas/room.ts`
- `src/lib/schemas/guest.ts`
- `src/lib/schemas/platform.ts`
- `src/lib/schemas/chat.ts`
- `src/lib/schemas/sse.ts`
- `src/lib/schemas/api.ts`
- `src/lib/schemas/index.ts` — barrel export

**Files to modify:**
- All API routes in `src/app/api/` — validate incoming requests, type outgoing responses
- `src/lib/chat/types.ts` — replace with zod-inferred types or re-export from schemas
- All client-side fetches in studio/dashboard components

**Acceptance Criteria:**
- [ ] Every API route validates its request body with zod
- [ ] Every API response uses a typed response helper
- [ ] Client-side code uses schema validation (`.parse()` or `.safeParse()`) on API responses
- [ ] `Platform` type derived from zod enum, used everywhere (replaces string literal unions)
- [ ] `npm run build` passes with zero type errors
- [ ] Existing tests (if any) still pass

**Edge Cases:**
- Zod `.parse()` throws on invalid data — use `.safeParse()` in API routes and return 400 with error details
- `SSEEventData` discriminated union must preserve the `type` discriminator pattern
- Don't break the Redis serialization — schemas validate application data, not Redis wire format

---

### F-06: Schema Evolution (Prisma Models)
**Agent:** DATA (Schema)
**Priority:** Critical
**Depends on:** F-05 (types must be defined first)

**Problem:** No Participant model (guest history lost), no StreamSession model, `selectedPlatforms` is unvalidated string array, Room.status is a loose string.

**Implementation:**
1. Add `RoomStatus` enum: `LOBBY | LIVE | ENDED`
2. Add `PlatformType` enum: `YOUTUBE | TWITCH | KICK | TIKTOK`
3. Convert `Room.status` from `String` to `RoomStatus` enum
4. Convert `Room.selectedPlatforms` from `String[]` to `PlatformType[]`
5. Convert `PlatformConnection.platform` from `String` to `PlatformType` enum
6. Add `Participant` model:
   ```prisma
   model Participant {
     id        String   @id @default(cuid())
     roomId    String
     room      Room     @relation(fields: [roomId], references: [id])
     name      String
     identity  String   // LiveKit identity (host-xxx or guest-xxx)
     role      ParticipantRole // HOST | GUEST
     joinedAt  DateTime @default(now())
     leftAt    DateTime?
   }
   ```
7. Add `Room` relation to participants
8. Write migration with data backfill for existing rows

**Files to modify:**
- `prisma/schema.prisma` — add enums, models, relations
- `src/app/api/rooms/route.ts` — use enums on room creation
- `src/app/api/rooms/[code]/admit/route.ts` — create Participant record
- `src/app/api/rooms/[code]/leave/route.ts` — update Participant.leftAt
- `src/app/api/rooms/[code]/end/route.ts` — set status to ENDED, update all Participant.leftAt
- `src/app/session-summary/[code]/page.tsx` — query Participant records for stats

**Acceptance Criteria:**
- [ ] Migration runs without data loss on existing rooms
- [ ] `Room.status` is enum (no more string comparison)
- [ ] `PlatformConnection.platform` is enum
- [ ] Participant records created on admit, updated on leave/end
- [ ] Session summary reads from Participant table (not Redis)
- [ ] `prisma migrate dev` succeeds cleanly

**Edge Cases:**
- Backfill: existing rooms with `status: "active"` → `LOBBY` (they're not actually live since no RTMP)
- Existing `PlatformConnection` rows with lowercase strings must map to uppercase enums
- If migration fails halfway, must be rollback-safe (single transaction)
- `selectedPlatforms` array may contain values not in enum — handle gracefully in migration

---

### F-07: OAuth Token Refresh
**Agent:** AUTH (Gatekeeper)
**Priority:** High
**Depends on:** F-06 (PlatformType enum must exist)

**Problem:** `PlatformConnection` stores tokens with `expiresAt` but no refresh logic. YouTube tokens expire in 1 hour. Twitch tokens expire in 4 hours. After expiry, chat connectors silently fail.

**User Flow:**
1. User connects YouTube in `/settings/platforms` (works today)
2. User creates a room and starts chatting (works for ~1 hour)
3. **Currently:** YouTube chat stops silently after token expiry
4. **After fix:** Token auto-refreshes before expiry. If refresh fails, user gets notified in studio.

**Implementation:**
1. Create `src/lib/auth/token-refresh.ts`:
   - `refreshYouTubeToken(connection: PlatformConnection): Promise<TokenResult>`
   - `refreshTwitchToken(connection: PlatformConnection): Promise<TokenResult>`
   - `needsRefresh(connection: PlatformConnection): boolean` (true if expires within 5 min)
   - `refreshIfNeeded(connection: PlatformConnection): Promise<PlatformConnection>`
2. Call `refreshIfNeeded` before starting each chat connector in `src/lib/chat/manager.ts`
3. Update `PlatformConnection` in DB after successful refresh
4. If refresh fails (revoked token), publish `PLATFORM_TOKEN_EXPIRED` SSE event
5. Add UI indicator in studio for expired platform connections

**Files to create:**
- `src/lib/auth/token-refresh.ts`

**Files to modify:**
- `src/lib/chat/manager.ts` — call refreshIfNeeded before connecting
- `src/lib/chat/youtube.ts` — pass fresh token on each poll cycle
- `src/lib/chat/twitch.ts` — reconnect with fresh token on auth failure
- `src/lib/chat/types.ts` (or schemas) — add `PLATFORM_TOKEN_EXPIRED` event type
- `src/app/api/rooms/[code]/chat/connect/route.ts` — refresh before starting

**Acceptance Criteria:**
- [ ] YouTube token refreshes automatically before expiry
- [ ] Twitch token refreshes automatically before expiry
- [ ] Failed refresh sends `PLATFORM_TOKEN_EXPIRED` SSE event
- [ ] Studio UI shows warning badge on expired platforms
- [ ] Kick and TikTok gracefully skip (no OAuth tokens to refresh)
- [ ] DB updated with new token after refresh

**Edge Cases:**
- User revokes app access on YouTube → refresh returns 401 → must not retry infinitely, mark as disconnected
- Concurrent refresh attempts (two chat polls hit expiry simultaneously) → must be idempotent
- Token refresh during active stream → must not interrupt existing chat connection
- Neon cold start during refresh → retry once with backoff

---

### F-08: Platform Settings UX Improvements
**Agent:** AUTH (Gatekeeper)
**Priority:** Medium
**Depends on:** F-07

**Problem:** Platform connection settings page works but lacks feedback on token status, expiry, and connection health.

**User Flow:**
1. User navigates to `/settings/platforms`
2. Sees all 4 platforms with connection status
3. **New:** Sees token expiry countdown for YouTube/Twitch
4. **New:** Sees "Healthy" / "Expiring Soon" / "Expired" badges
5. **New:** Can manually refresh a token without disconnecting/reconnecting
6. Can disconnect a platform

**Implementation:**
1. Add token health indicator component
2. Add manual refresh button per platform
3. Add API endpoint `POST /api/platforms/refresh` to trigger token refresh
4. Show channel name, avatar, and subscriber count where available

**Acceptance Criteria:**
- [ ] Token health visible for each connected platform
- [ ] Manual refresh button works for YouTube and Twitch
- [ ] Disconnect still works as before
- [ ] Page loads fast (server-side data fetch)

**Edge Cases:**
- User with expired token sees "Expired" badge and "Reconnect" CTA (not just "Refresh")
- Kick/TikTok show "No token required" status

---

### F-09: Chat Deduplication & Delivery Pipeline
**Agent:** CHAT (Relay)
**Priority:** High
**Depends on:** F-05 (chat schema), F-06 (schema evolution)

**Problem:** Double-poll (connector polls platform → Redis, SSE polls Redis → client) with 5s lookback produces duplicates. No message dedup. 500-message cap with full array copy on every add.

**User Flow:**
1. Host sees chat messages from YouTube, Twitch, Kick, TikTok in unified feed
2. **Currently:** Duplicate messages appear; list re-renders fully on each new message
3. **After fix:** Zero duplicates; efficient append-only updates; smooth scrolling at high volume

**Implementation:**
1. Add message dedup in `publishChat()` — use `msg.id` + `msg.platform` as dedup key
2. Replace polling with cursor-based approach:
   - Track `lastMessageId` instead of `lastTs` (timestamps can collide)
   - SSE returns only messages newer than cursor
3. In chat store, use `Map<string, ChatMessage>` instead of array for O(1) dedup
4. Convert to array only for display (memoized)
5. Add `react-virtual` (or `@tanstack/react-virtual`) for chat virtualization
6. Only render visible messages (~20) instead of all 500

**Files to modify:**
- `src/lib/redis.ts` — cursor-based `pollChat`, dedup on write
- `src/store/chat.ts` — Map-based storage, memoized array conversion
- `src/components/chat/ChatPanel.tsx` — virtualized list
- `src/components/chat/ChatMessage.tsx` — ensure stable key prop

**Acceptance Criteria:**
- [ ] Zero duplicate messages in chat feed
- [ ] Chat feed handles 500+ messages without visible jank
- [ ] Scrolling is smooth at 60fps with 500 messages
- [ ] Only ~20 DOM nodes rendered at any time (verify in Elements inspector)
- [ ] Auto-scroll to bottom on new message (unless user scrolled up)
- [ ] "New messages below" indicator when user is scrolled up

**Edge Cases:**
- Identical message text from same user within 1s = same message (platform echo)
- User scrolls up → new messages arrive → must NOT auto-scroll (breaks reading)
- User scrolls to bottom → auto-scroll resumes
- Platform sends message with empty body → skip, don't render
- Emoji-only messages → must render (don't filter)
- Very long messages (>500 chars) → truncate with "Show more"

---

### F-10: Chat Connector Resilience
**Agent:** CHAT (Relay)
**Priority:** Medium
**Depends on:** F-07 (token refresh), F-09 (delivery pipeline)

**Problem:** Chat connectors crash silently. No retry logic. No health reporting. TikTok connector especially fragile.

**User Flow:**
1. Host starts studio → chat connectors start for connected platforms
2. **Currently:** If YouTube connector fails, chat silently stops. No indication.
3. **After fix:** Connector auto-retries with backoff. Studio shows per-platform health. Host can manually restart a failed connector.

**Implementation:**
1. Add connector health state: `CONNECTING | CONNECTED | RECONNECTING | FAILED`
2. Add exponential backoff retry (max 5 attempts, 1s → 16s)
3. Publish `CHAT_CONNECTOR_STATUS` SSE event on state change
4. Add per-platform health indicators in studio UI
5. Add manual reconnect button per platform in studio

**Files to modify:**
- `src/lib/chat/manager.ts` — retry wrapper, health tracking
- `src/lib/chat/youtube.ts` — report status changes
- `src/lib/chat/twitch.ts` — handle disconnect/reconnect events from tmi.js
- `src/lib/chat/kick.ts` — handle Pusher connection state
- `src/lib/chat/tiktok.ts` — handle connection errors, cap retries

**Acceptance Criteria:**
- [ ] Failed connector retries automatically (up to 5 times)
- [ ] Studio UI shows per-platform connection status
- [ ] Host can manually reconnect a failed platform
- [ ] One platform failure does not affect others
- [ ] All connector failures are logged (console + SSE event)

**Edge Cases:**
- All 4 connectors fail simultaneously → studio still functional (video works, just no chat)
- Platform rate-limits the connector → must respect rate limit, increase backoff
- Token expires mid-stream → triggers F-07 refresh, then reconnects
- Room ends while connector is reconnecting → must abort retry loop cleanly

---

### F-11: Studio State Persistence
**Agent:** STUDIO (Stage)
**Priority:** High
**Depends on:** F-01 (clean store), F-06 (schema)

**Problem:** Browser refresh loses all studio state: layout preference, pinned participant, on-stage list, chat filters. Host must reconfigure everything.

**User Flow:**
1. Host sets layout to "spotlight", pins a participant, filters out TikTok chat
2. Host accidentally refreshes browser
3. **Currently:** Everything resets to defaults (grid layout, no pin, all filters on)
4. **After fix:** State restored from Redis. Host sees exact same configuration.

**Implementation:**
1. Create `src/lib/studio-state.ts`:
   - `saveStudioState(roomCode, state)` → Redis with room TTL
   - `loadStudioState(roomCode)` → returns saved state or defaults
2. Debounce state saves (500ms) to avoid Redis spam
3. Save on: layout change, pin change, on-stage change, chat filter change
4. Load on: StudioClient mount (before rendering)
5. Store in Redis key `room:{code}:hostState` with same TTL as room

**Files to modify:**
- `src/lib/redis.ts` — add `saveStudioState` / `loadStudioState`
- `src/components/studio/StudioClient.tsx` — load state on mount, save on changes
- `src/store/studio.ts` — add `hydrateFromSaved(state)` action
- `src/store/chat.ts` — add `hydrateFilters(filters)` action

**Acceptance Criteria:**
- [ ] Layout preference persists across refresh
- [ ] Pinned participant persists (if still in room)
- [ ] Chat filters persist
- [ ] State loads before first render (no flash of default state)
- [ ] State clears when room ends

**Edge Cases:**
- Pinned participant left the room before refresh → clear pin, don't error
- On-stage participant left → remove from on-stage list silently
- Redis unavailable → use defaults, don't block studio load
- Two tabs open with same room → last-write-wins (acceptable)
- State save fails → log warning, don't interrupt studio

---

### F-12: Error Boundaries & Recovery UX
**Agent:** STUDIO (Stage)
**Priority:** High
**Depends on:** F-04 (code splitting)

**Problem:** No error boundary wrapping the studio. If LiveKit fails, entire page crashes with no recovery option.

**User Flow:**
1. Host is in studio → LiveKit WebRTC connection drops (network issue, server restart)
2. **Currently:** White screen or frozen UI. Must close tab and rejoin.
3. **After fix:** Error boundary catches crash, shows "Connection lost" with "Rejoin" button. Auto-reconnect attempts first.

**Implementation:**
1. Create `src/components/studio/StudioErrorBoundary.tsx`:
   - Catches render errors from LiveKit components
   - Shows recovery UI with room info and rejoin button
   - Logs error details for debugging
2. Create `src/components/studio/ConnectionStatus.tsx`:
   - Shows connection quality indicator (green/yellow/red)
   - Shows reconnecting state
   - Shows "Reconnected" toast on recovery
3. Add LiveKit connection event handlers for disconnect/reconnect
4. Create `src/app/error.tsx` for app-level error boundary

**Files to create:**
- `src/components/studio/StudioErrorBoundary.tsx`
- `src/components/studio/ConnectionStatus.tsx`
- `src/app/studio/[code]/error.tsx`

**Files to modify:**
- `src/app/studio/[code]/page.tsx` — wrap StudioClient with error boundary

**Acceptance Criteria:**
- [ ] LiveKit crash shows recovery UI, not white screen
- [ ] "Rejoin" button works (creates new token, reconnects)
- [ ] Connection quality indicator visible in studio
- [ ] Auto-reconnect attempted before showing error UI
- [ ] Error logged with enough detail to debug (room code, participant identity, error stack)

**Edge Cases:**
- Error in error boundary itself → fallback to app-level error.tsx
- Rapid disconnect/reconnect cycles → debounce reconnection indicator
- Guest in studio when host's connection drops → guests stay connected (LiveKit SFU handles this)
- Room ended server-side while client is disconnected → show "Session ended" not "Reconnect"

---

### F-13: Guest Join Flow Improvements
**Agent:** STUDIO (Stage)
**Priority:** Medium
**Depends on:** F-03 (SSE fix), F-06 (Participant model)

**Problem:** Guest join flow works but has no device preview, no connection quality check, and no waiting room UX.

**User Flow:**
1. Guest opens invite link (`/join/{code}`)
2. **New:** Guest sees device preview (camera + mic test) before requesting to join
3. Guest enters name and requests to join
4. **New:** Guest sees animated waiting state with position in queue
5. Host admits/denies in backstage panel
6. **New:** On admit, guest enters with devices already configured
7. **New:** On deny, guest sees polite message with option to request again

**Implementation:**
1. Add device preview component (camera/mic selector + preview)
2. Add waiting room UI (animated dots, queue position, "Waiting for host...")
3. Add device pre-configuration so guest enters with selected devices
4. Add deny message with retry option (cooldown timer)
5. Record Participant in DB on successful admit

**Files to modify:**
- `src/app/join/[code]/page.tsx` — add device preview step
- `src/components/studio/BackstagePanel.tsx` — show guest device info to host

**Acceptance Criteria:**
- [ ] Guest can preview camera/mic before requesting to join
- [ ] Guest sees clear waiting state after requesting
- [ ] Denied guest sees polite message, can retry after 30s
- [ ] Admitted guest enters with pre-selected devices
- [ ] Participant record created in DB on admit

**Edge Cases:**
- Guest has no camera → can still join with mic only
- Guest has no mic → can still join with camera only (muted)
- Guest denies browser permission → show clear instructions to enable
- Guest requests while room is full (6 participants) → show "Room is full" immediately
- Guest refreshes during wait → must re-request (pending state is server-side)
- Multiple guests with same name → append number suffix

---

### F-14: Rate Limiting
**Agent:** SHIELD (Guard)
**Priority:** High
**Depends on:** F-05 (typed responses for 429 errors)

**Problem:** Public endpoints have no rate limiting. Anyone can flood guest requests, room creation, or chat connections.

**User Flow:** N/A (transparent to legitimate users)

**Implementation:**
1. Create `src/lib/rate-limit.ts` using Upstash Redis `@upstash/ratelimit`:
   - Sliding window algorithm
   - IP-based for unauthenticated endpoints
   - User-based for authenticated endpoints
2. Rate limits per endpoint:
   | Endpoint | Limit | Window |
   |----------|-------|--------|
   | `POST /api/rooms` | 5 | 1 min |
   | `POST /api/rooms/[code]/request` | 3 | 1 min (per IP) |
   | `POST /api/rooms/[code]/chat/connect` | 2 | 1 min |
   | `POST /api/platforms/connect` | 5 | 1 min |
   | `GET /api/rooms/[code]/stream` | 3 | 1 min (per IP) |
3. Return `429 Too Many Requests` with `Retry-After` header
4. Use existing Upstash Redis (no new infra cost)

**Files to create:**
- `src/lib/rate-limit.ts`

**Files to modify:**
- All rate-limited API routes — add rate limit check at top

**Acceptance Criteria:**
- [ ] Rate limit headers present on responses (`X-RateLimit-Limit`, `X-RateLimit-Remaining`)
- [ ] 429 returned when limit exceeded with `Retry-After` header
- [ ] Legitimate usage never hits rate limits
- [ ] Rate limit uses existing Upstash Redis (no additional cost)
- [ ] Rate limit failures (Redis down) → allow request (fail-open)

**Edge Cases:**
- Users behind shared IP (corporate NAT) → per-IP limits must be generous enough
- Rate limit Redis key must have TTL (auto-cleanup)
- Vercel serverless may have different source IPs per invocation → use `x-forwarded-for` header

---

### F-15: Input Validation & Sanitization
**Agent:** SHIELD (Guard)
**Priority:** Medium
**Depends on:** F-05 (zod schemas)

**Problem:** User input (guest names, room titles) is not sanitized. Potential XSS via chat message injection (from platforms).

**Implementation:**
1. Validate all user input with zod schemas (from F-05)
2. Sanitize guest display names (strip HTML, limit length to 50 chars)
3. Sanitize room titles (strip HTML, limit to 100 chars)
4. Sanitize incoming chat messages from platforms (strip HTML, preserve emoji)
5. Add CSP headers in `next.config.ts`
6. Validate room codes (alphanumeric, exact length)

**Files to modify:**
- `src/lib/schemas/*.ts` — add `.transform()` for sanitization
- `src/app/api/rooms/[code]/request/route.ts` — validate guest name
- `src/app/api/rooms/route.ts` — validate room title
- `src/lib/chat/manager.ts` — sanitize incoming chat messages
- `next.config.ts` — add security headers

**Acceptance Criteria:**
- [ ] HTML in guest names is stripped (not rendered)
- [ ] HTML in chat messages is stripped (preserving emoji)
- [ ] Room codes validated to exact format
- [ ] CSP headers prevent inline script execution
- [ ] XSS via platform chat messages is impossible

**Edge Cases:**
- Chat messages with markdown-like syntax → strip (we don't render markdown in chat)
- Unicode names (international users) → must be preserved
- Emoji in names → must be preserved
- Empty string after sanitization → reject with error message
- Very long messages (>2000 chars) → truncate at store level

---

## Orchestration Rules

### For the Lead (Architect)

1. **Never assign overlapping files.** Each file has exactly one owner at any time. If two features touch the same file, they run sequentially (dependency ordering).
2. **Review every PR.** Use the `superpowers:code-review` agent on each completed feature before merging.
3. **Run full build + type-check** after each feature merge: `npm run build && npx tsc --noEmit`
4. **Integration test** after each phase: manually verify the critical path (create room → admit guest → chat → end session → see summary).
5. **No speculative work.** Agents must not add features, refactoring, or "improvements" beyond their spec.

### For Each Agent

1. **Research first.** Before writing code, use context7 or web search to verify current best practices for the specific library/pattern you're using.
2. **Read before writing.** Read every file you plan to modify. Understand existing patterns before changing them.
3. **Type-check before declaring done.** Run `npx tsc --noEmit` on your changes.
4. **Test the critical path.** After your changes, verify: room creation, guest admission, chat flow, session end.
5. **Document breaking changes.** If your change requires other agents to update their work, note it explicitly.
6. **Ask, don't assume.** If a spec is ambiguous, ask the lead before implementing.

### Conflict Resolution

- If two agents need the same file: the agent whose feature is listed earlier in the dependency graph goes first.
- If a downstream agent discovers a bug in an upstream agent's work: file it as a fix task for the upstream agent, don't fix it yourself.
- If a feature turns out to be larger than expected: split it and notify the lead before proceeding.
