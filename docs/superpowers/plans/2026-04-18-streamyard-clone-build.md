# Zerocast Clone — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development
> to implement this plan.

**Goal:** Build a fully functional Zerocast clone with WebRTC multi-guest
studio, aggregated multi-platform chat (YouTube, Twitch, Kick, TikTok), and
guest admission gate.

**Architecture:** Next.js 15 App Router + TypeScript. LiveKit Cloud for WebRTC
SFU (up to 6 participants). SSE + Upstash Redis Pub/Sub for real-time chat
delivery. NextAuth.js v5 + Neon/Prisma for auth and persistence.

**Tech Stack:** Next.js 15, TypeScript, NextAuth v5, Prisma, Neon Postgres,
Upstash Redis, LiveKit Cloud, tmi.js, pusher-js, tiktok-live-connector, Zustand,
Tailwind CSS, shadcn/ui

**Spec:** docs/superpowers/specs/2026-04-17-Zerocast-clone-design.md

---

## Chunk 1: Project Bootstrap

### Task 1: Scaffold Next.js project and install all dependencies

**Files:**

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `prisma/schema.prisma`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`

- [ ] Run
      `npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-git --yes`
      in `/Users/MAC/Desktop/antigravity/Clone-Zerocast`
- [ ] Install all dependencies:
  ```bash
  npm install next-auth@beta @auth/prisma-adapter @prisma/client \
    @upstash/redis livekit-server-sdk @livekit/components-react @livekit/components-styles \
    tmi.js pusher-js tiktok-live-connector zustand \
    @radix-ui/react-dialog @radix-ui/react-toast @radix-ui/react-avatar \
    @radix-ui/react-switch @radix-ui/react-label clsx tailwind-merge lucide-react
  npm install -D prisma @types/tmi.js
  npx shadcn@latest init --yes --defaults
  npx shadcn@latest add button card input label badge toast avatar switch dialog
  ```
- [ ] Write `prisma/schema.prisma` with full schema (User, PlatformConnection,
      Room, Account, Session for NextAuth)
- [ ] Write `.env.example` with all required env vars
- [ ] Write `next.config.ts` with transpilePackages for livekit
- [ ] Initialize git repo, create GitHub repo `antigravity-Zerocast` via
      `gh repo create`, push
- [ ] Commit: `chore: scaffold Next.js 15 project with all dependencies`

---

## Chunk 2: Auth + Database

### Task 2: NextAuth.js v5 + Prisma + Neon setup

**Files:**

- Create: `src/auth.ts`
- Create: `src/middleware.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/prisma.ts`
- Create: `src/app/login/page.tsx`
- Modify: `src/app/layout.tsx` (add SessionProvider)

- [ ] Create Neon project at neon.tech (free tier), copy DATABASE_URL to
      `.env.local`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Write `src/auth.ts` — NextAuth v5 config with PrismaAdapter, Google
      provider (with youtube.readonly scope), credentials provider for email
- [ ] Write `src/middleware.ts` — protect `/dashboard`, `/settings`, `/studio`
      routes
- [ ] Write `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Write `src/lib/prisma.ts` — singleton Prisma client
- [ ] Write `src/app/login/page.tsx` — clean sign-in page with Google button and
      email option
- [ ] Test: sign in with Google works, redirects to /dashboard
- [ ] Commit: `feat: NextAuth v5 + Prisma + Neon auth setup`

---

## Chunk 3: Core UI Pages

### Task 3: Landing page, Dashboard, and Settings/Platforms page

**Files:**

- Create: `src/app/page.tsx` (landing)
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/loading.tsx`
- Create: `src/app/settings/platforms/page.tsx`
- Create: `src/components/dashboard/RoomCard.tsx`
- Create: `src/components/dashboard/PlatformConnectionCard.tsx`
- Create: `src/components/ui/Navbar.tsx`
- Create: `src/app/api/platforms/connect/route.ts`
- Create: `src/app/api/platforms/disconnect/route.ts`

- [ ] Write landing page `/` — hero section "Go Live in Seconds", feature list,
      CTA button "Create Studio" that links to dashboard
- [ ] Write dashboard `/dashboard` — shows active/past rooms, "Create Studio"
      button that POSTs to /api/rooms, shows connected platforms summary
- [ ] Write settings/platforms `/settings/platforms` — form to connect: Twitch
      (channel name), Kick (channel name), TikTok (username), YouTube (OAuth
      already handled by NextAuth — show connect status)
- [ ] Write `POST /api/platforms/connect` — saves PlatformConnection to DB
- [ ] Write `DELETE /api/platforms/disconnect` — removes PlatformConnection from
      DB
- [ ] Verify: can add Twitch channel name, see it listed as connected
- [ ] Commit: `feat: landing page, dashboard, and platform settings UI`

---

## Chunk 4: LiveKit + Room API Backend

### Task 4: Room creation API, LiveKit token generation, guest admission APIs

**Files:**

- Create: `src/lib/livekit.ts`
- Create: `src/lib/redis.ts`
- Create: `src/app/api/rooms/route.ts` (POST: create room)
- Create: `src/app/api/rooms/[code]/token/route.ts` (GET: host token)
- Create: `src/app/api/rooms/[code]/request/route.ts` (POST: guest requests
  join)
- Create: `src/app/api/rooms/[code]/admit/route.ts` (POST: host admits guest)
- Create: `src/app/api/rooms/[code]/deny/route.ts` (POST: host denies guest)
- Create: `src/app/api/rooms/[code]/end/route.ts` (POST: end studio session)

- [ ] Create LiveKit account at livekit.io (free tier), create project, copy API
      key/secret/URL to `.env.local`
- [ ] Create Upstash Redis at upstash.com (free tier), copy REST URL/token to
      `.env.local`
- [ ] Write `src/lib/livekit.ts`:
  - `createRoom(code)` — creates LiveKit room
  - `generateHostToken(roomCode, userId)` — roomCreate + roomJoin grants
  - `generateParticipantToken(roomCode, participantName)` — roomJoin grant only
  - `getParticipantCount(roomCode)` — query LiveKit for current count
  - `closeRoom(roomCode)` — delete LiveKit room
- [ ] Write `src/lib/redis.ts`:
  - `setRoomInfo(code, data)` / `getRoomInfo(code)` with 24h TTL
  - `setPendingGuest(code, guestId, data)` / `getPendingGuest(code, guestId)`
  - `setApprovedGuest(code, guestId, token)` / `getApprovedGuest(code, guestId)`
  - `deleteRoomKeys(code)` — cleans up all room:{code}:\* keys
  - `publishEvent(code, event)` — publish to room:{code}:events channel
  - `publishChat(code, message)` — publish to room:{code}:chat channel
- [ ] Write `POST /api/rooms` — generates 6-char code, creates LiveKit room,
      saves Room to DB, stores in Redis, returns `{code, hostToken}`
- [ ] Write `GET /api/rooms/[code]/token` — returns fresh host token (auth
      required)
- [ ] Write `POST /api/rooms/[code]/request` — stores guestId+name in Redis
      pending, publishes GUEST_REQUEST event
- [ ] Write `POST /api/rooms/[code]/admit` — checks participant count ≤ 5,
      generates participant token, publishes GUEST_ADMITTED event
- [ ] Write `POST /api/rooms/[code]/deny` — publishes GUEST_DENIED event,
      removes pending key
- [ ] Write `POST /api/rooms/[code]/end` — marks Room ended in DB, deletes Redis
      keys, closes LiveKit room
- [ ] Commit:
      `feat: room API, LiveKit token generation, guest admission backend`

---

## Chunk 5: SSE Endpoint + Chat Infrastructure

### Task 5: SSE real-time endpoint and chat connector infrastructure

**Files:**

- Create: `src/app/api/rooms/[code]/stream/route.ts` (Edge runtime SSE)
- Create: `src/lib/chat/types.ts`
- Create: `src/lib/chat/normalize.ts`
- Create: `src/lib/chat/manager.ts` (connector lifecycle)
- Create: `src/lib/chat/twitch.ts`
- Create: `src/lib/chat/youtube.ts`
- Create: `src/lib/chat/kick.ts`
- Create: `src/lib/chat/tiktok.ts`

- [ ] Write `src/lib/chat/types.ts`:
  ```ts
  export interface ChatMessage {
    id: string;
    platform: "youtube" | "twitch" | "kick" | "tiktok";
    author: {
      name: string;
      avatar?: string;
      color?: string;
      badges?: string[];
    };
    message: string;
    timestamp: string; // ISO string (safe for SSE)
  }
  export type SSEEvent =
    | { type: "CHAT_MESSAGE"; data: ChatMessage }
    | { type: "GUEST_REQUEST"; data: { guestId: string; name: string } }
    | { type: "GUEST_ADMITTED"; data: { guestId: string; token: string } }
    | { type: "GUEST_DENIED"; data: { guestId: string } }
    | { type: "GUEST_LEFT"; data: { participantId: string } }
    | { type: "STUDIO_ENDED" };
  ```
- [ ] Write `src/lib/chat/normalize.ts` — per-platform raw message → ChatMessage
      normalization functions
- [ ] Write `src/lib/chat/twitch.ts` — tmi.js client, connect/disconnect,
      publishes normalized messages to Redis
- [ ] Write `src/lib/chat/youtube.ts` — polls YouTube Live Chat API every 20s
      using stored OAuth tokens, publishes to Redis
- [ ] Write `src/lib/chat/kick.ts` — Pusher WebSocket connection to Kick's
      public chat channel, publishes to Redis
- [ ] Write `src/lib/chat/tiktok.ts` — tiktok-live-connector wrapper
      (non-blocking: catch all errors, log but don't throw), publishes to Redis
- [ ] Write `src/lib/chat/manager.ts` — `startConnectors(roomCode, platforms)`
      and `stopConnectors(roomCode)`, manages connector lifecycle per room,
      stores active connectors in a global Map
- [ ] Write `src/app/api/rooms/[code]/stream/route.ts`:
  - `export const runtime = 'edge'`
  - Subscribes to Upstash Redis `room:{code}:chat` and `room:{code}:events` via
    polling (Upstash REST doesn't support true push in Edge — use short-poll
    Redis list or SSE with keepalive)
  - Returns `ReadableStream` with `text/event-stream` content type
  - Heartbeat every 15s to keep connection alive
- [ ] Modify `POST /api/rooms` to call `startConnectors` after room creation
- [ ] Modify `POST /api/rooms/[code]/end` to call `stopConnectors`
- [ ] Commit: `feat: SSE endpoint (Edge runtime) + all chat platform connectors`

---

## Chunk 6: Studio Frontend

### Task 6: Studio page, video grid, guest admission UI

**Files:**

- Create: `src/app/studio/[code]/page.tsx`
- Create: `src/app/studio/[code]/StudioClient.tsx` (client component)
- Create: `src/components/studio/VideoGrid.tsx`
- Create: `src/components/studio/VideoTile.tsx`
- Create: `src/components/studio/ControlBar.tsx`
- Create: `src/components/studio/GuestRequestToast.tsx`
- Create: `src/components/studio/InviteLink.tsx`
- Create: `src/store/studio.ts`

- [ ] Write `src/store/studio.ts` Zustand store:
  - `participants: Record<string, { name: string; onScreen: boolean }>`
  - `pendingGuests: Array<{ guestId: string; name: string }>`
  - `toggleOnScreen(participantId)`, `addPendingGuest`, `removePendingGuest`
- [ ] Write `src/app/studio/[code]/page.tsx` — server component, validates auth,
      fetches host token, renders StudioClient
- [ ] Write `src/app/studio/[code]/StudioClient.tsx` — wraps `LiveKitRoom` from
      `@livekit/components-react`, connects SSE for events, renders VideoGrid +
      ChatPanel + ControlBar
- [ ] Write `src/components/studio/VideoGrid.tsx` — uses `useParticipants()`
      hook from LiveKit, renders VideoTile per participant, auto-arranges with
      CSS Grid (1→full, 2→side-by-side, 3-4→2×2, 5-6→2×3)
- [ ] Write `src/components/studio/VideoTile.tsx` — renders participant video
      track, name label, mute indicator, on/off-screen toggle button; hides
      video with `visibility: hidden` when off-screen (keeps layout slot)
- [ ] Write `src/components/studio/ControlBar.tsx` — mic toggle, camera toggle,
      screen share toggle using LiveKit hooks; End Studio button that calls
      `/api/rooms/[code]/end`
- [ ] Write `src/components/studio/GuestRequestToast.tsx` — displays when SSE
      delivers GUEST_REQUEST; shows name + Admit/Deny buttons; calls respective
      APIs
- [ ] Write `src/components/studio/InviteLink.tsx` — shows `/join/[code]` URL,
      copy-to-clipboard button
- [ ] Add `@livekit/components-styles` import to layout
- [ ] Commit:
      `feat: studio page with LiveKit video grid, controls, guest admission UI`

---

## Chunk 7: Guest Join Flow

### Task 7: Guest join page and join flow

**Files:**

- Create: `src/app/join/[code]/page.tsx`
- Create: `src/app/join/[code]/JoinClient.tsx`
- Create: `src/app/studio-ended/page.tsx`

- [ ] Write `src/app/join/[code]/page.tsx` — server component, checks room
      exists and is active (via Neon), renders JoinClient
- [ ] Write `src/app/join/[code]/JoinClient.tsx`:
  - State: `status: 'form' | 'waiting' | 'joining' | 'joined'`
  - Shows display name form → on submit, POSTs to `/api/rooms/[code]/request`
  - Opens SSE connection to `/api/rooms/[code]/stream`
  - On `GUEST_ADMITTED` event: connects to LiveKit with received token → renders
    participant video grid
  - On `GUEST_DENIED` event: shows "The host declined your request"
  - On `STUDIO_ENDED` event: redirects to `/studio-ended`
  - Guest sees the same VideoGrid (read-only) and ChatPanel
- [ ] Write `src/app/studio-ended/page.tsx` — simple "This studio session has
      ended" page
- [ ] Commit: `feat: guest join page with admission flow and LiveKit connection`

---

## Chunk 8: Chat UI

### Task 8: Chat panel and Zustand chat store

**Files:**

- Create: `src/store/chat.ts`
- Create: `src/components/chat/ChatPanel.tsx`
- Create: `src/components/chat/ChatMessage.tsx`
- Create: `src/components/chat/PlatformBadge.tsx`
- Create: `src/components/chat/PlatformFilter.tsx`

- [ ] Write `src/store/chat.ts` Zustand store:
  - `messages: ChatMessage[]` (capped at 500 to prevent memory issues)
  - `filters: Record<Platform, boolean>` (all true by default)
  - `addMessage(msg)`, `toggleFilter(platform)`, `clearMessages()`
  - `filteredMessages` derived selector
- [ ] Write `src/components/chat/PlatformBadge.tsx` — colored pill/icon per
      platform: YouTube=red, Twitch=purple, Kick=green, TikTok=black
- [ ] Write `src/components/chat/ChatMessage.tsx` — renders PlatformBadge +
      author name + message text + timestamp; Twitch messages use author's color
      for name
- [ ] Write `src/components/chat/PlatformFilter.tsx` — row of toggle buttons for
      each platform, toggles visibility in chat store
- [ ] Write `src/components/chat/ChatPanel.tsx`:
  - Subscribes to Zustand filteredMessages
  - Auto-scrolls to bottom on new messages (uses ref + useEffect)
  - `useEffect` for SSE subscription: on `CHAT_MESSAGE` event → `addMessage()`
  - Renders PlatformFilter at top, scrollable message list below
- [ ] Commit: `feat: chat panel with platform badges, filters, and auto-scroll`

---

## Chunk 9: Integration, Testing & Deployment

### Task 9: Wire everything together, test, deploy to Vercel

**Files:**

- Modify: `src/app/studio/[code]/StudioClient.tsx` (integrate ChatPanel)
- Modify: `src/app/join/[code]/JoinClient.tsx` (integrate ChatPanel)
- Create: `src/app/api/rooms/[code]/chat/connect/route.ts` (POST: start
  connectors for a room)
- Modify: `.env.local` → set `NEXTAUTH_URL=http://localhost:3000` for dev

- [ ] Integrate `ChatPanel` into `StudioClient.tsx` (right column of studio
      layout)
- [ ] Integrate `ChatPanel` into `JoinClient.tsx` (guests see chat too)
- [ ] Run `npm run build` — fix any TypeScript errors
- [ ] Test manually (checklist from spec):
  1. Sign in with Google
  2. Connect Twitch channel name in settings
  3. Create studio → copy invite link
  4. Open incognito → visit invite link → enter name → click Request to Join
  5. Admit guest in host studio → guest appears in video grid
  6. Toggle guest Off Screen → tile hides
  7. (If have Twitch stream active) Twitch chat shows with purple badge
  8. Platform filter toggles work
  9. End Studio → guests see "Studio has ended"
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Set all environment variables in Vercel dashboard
- [ ] Test deployed URL end-to-end
- [ ] Commit: `feat: full integration, tested and deployed to Vercel`

---

## Environment Variables Reference

```bash
# .env.local
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000

# Google OAuth — create at console.cloud.google.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Neon — create at neon.tech
DATABASE_URL=

# Upstash Redis — create at upstash.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# LiveKit Cloud — create at livekit.io
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=wss://your-project.livekit.cloud
```
