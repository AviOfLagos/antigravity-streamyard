# Zerocast Clone — Design Spec

**Date:** 2026-04-17  
**Status:** Approved (rev 2 — post spec-review fixes)

---

## Context

Build a browser-based live streaming studio that clones Zerocast's core feature
set:

- Host invites guests into a shared video room (WebRTC)
- Aggregated live chat from YouTube, Twitch, Kick, and TikTok in one panel
- Host controls which guests appear on screen
- Platform connections configured in account settings before going live
- Guests join via shareable link with no account required
- All infrastructure is free-tier compatible for development and testing

Streaming to platforms (RTMP broadcast) is deliberately deferred. The first
phase focuses entirely on the studio experience.

---

## Tech Stack

| Layer              | Choice                                            | Free Tier                 |
| ------------------ | ------------------------------------------------- | ------------------------- |
| Framework          | Next.js 15 App Router + TypeScript                | Vercel Hobby              |
| Auth               | NextAuth.js v5 (email + Google OAuth)             | Open source               |
| Database           | Neon (Postgres) + Prisma ORM                      | 0.5 GB / month            |
| Video/WebRTC       | LiveKit Cloud + `@livekit/components-react`       | 10,000 participant-min/mo |
| Real-time delivery | SSE (native Next.js) + Upstash Redis Pub/Sub      | 10,000 req/day            |
| Room state         | Upstash Redis                                     | Same free instance        |
| Chat — Twitch      | `tmi.js` (public IRC WebSocket)                   | Open source               |
| Chat — YouTube     | Google OAuth (via NextAuth) + Live Chat API       | 10,000 units/day          |
| Chat — Kick        | Kick Pusher WebSocket (public)                    | Open source               |
| Chat — TikTok      | `tiktok-live-connector` (unofficial, best-effort) | Open source               |

---

## Pages & Routing

| Route                 | Auth Required | Purpose                                           |
| --------------------- | ------------- | ------------------------------------------------- |
| `/`                   | No            | Landing / marketing page                          |
| `/login`              | No            | NextAuth.js sign-in (email or Google)             |
| `/dashboard`          | Yes (host)    | Room list + connected platforms overview          |
| `/settings/platforms` | Yes (host)    | Connect/disconnect YouTube, Twitch, Kick, TikTok  |
| `/studio/[code]`      | Yes (host)    | Live studio — video grid, chat, controls          |
| `/join/[code]`        | No            | Guest entry — enter display name, request to join |

Guests never need an account. They visit `/join/[code]` → enter a display name →
wait for host approval → join the studio.

---

## Data Models (Prisma)

```prisma
model User {
  id                  String               @id @default(cuid())
  email               String               @unique
  name                String?
  image               String?
  platformConnections PlatformConnection[]
  rooms               Room[]
  createdAt           DateTime             @default(now())
}

model PlatformConnection {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  platform     String   // 'youtube' | 'twitch' | 'kick' | 'tiktok'
  // Channel identifier (channel name, username, or channel ID)
  channelId    String
  channelName  String
  // OAuth tokens (YouTube only; others are public)
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  createdAt    DateTime @default(now())

  @@unique([userId, platform])
}

model Room {
  id        String   @id @default(cuid())
  code      String   @unique  // 6-char alphanumeric
  hostId    String
  host      User     @relation(fields: [hostId], references: [id])
  status    String   @default("active")  // 'active' | 'ended'
  createdAt DateTime @default(now())
  endedAt   DateTime?
}
```

---

## Redis Key Schema (Upstash)

```
room:{code}:info              → JSON { hostId, createdAt, livekitRoom }
room:{code}:pending:{guestId} → JSON { name, requestedAt }
room:{code}:approved:{guestId}→ JSON { token, approvedAt }
room:{code}:chat              → Pub/Sub channel (chat messages)
room:{code}:events            → Pub/Sub channel (guest requests, admission decisions)
```

---

## WebRTC / LiveKit Flow

### Room Creation (Host)

1. Host signs in → goes to `/dashboard` → clicks "Create Studio"
2. `POST /api/rooms` → server:
   - Generates a 6-char alphanumeric room code
   - Creates LiveKit room via `livekit-server-sdk`
   - Persists `Room` record in Neon
   - Stores room metadata in Redis (`room:{code}:info`)
   - Returns `{ code, hostToken }` (host token has `roomCreate + roomJoin`
     grants)
3. Host redirected to `/studio/{code}` → LiveKit React SDK connects with host
   token

### Guest Joining

1. Guest visits `/join/{code}` → enters display name → clicks "Request to Join"
2. `POST /api/rooms/{code}/request` → stores pending request in Redis with a
   `guestId` UUID
3. Server publishes to Redis Pub/Sub `room:{code}:events`:
   `{ type: 'GUEST_REQUEST', guestId, name }`
4. Host's studio SSE connection receives the event → shows notification:
   **"Amara wants to join [Admit] [Deny]"**
5. Host clicks Admit → `POST /api/rooms/{code}/admit` with `{ guestId }`
   - Server checks current participant count in LiveKit room; rejects with 400
     if count ≥ 6
6. Server generates LiveKit participant token → stores in Redis
   `room:{code}:approved:{guestId}`
7. Server publishes to `room:{code}:events`:
   `{ type: 'GUEST_ADMITTED', guestId, token }`
8. Guest's SSE connection receives the token → LiveKit SDK connects → guest
   appears in video grid

### On-Screen / Off-Screen

- Client-side only: host clicks toggle on a guest tile → tile hidden with CSS
  (`display: none`)
- State stored in Zustand: `{ [participantId]: { onScreen: boolean } }`
- Persists for the duration of the session only (lost on page refresh — known
  limitation)
- When streaming is added later, this maps to the broadcast layout compositor

### Ending a Studio Session

- Host clicks "End Studio" → `POST /api/rooms/{code}/end`
- Server: marks Room status as `ended` in Neon, deletes all Redis keys for the
  room, tears down all platform chat connectors, closes the LiveKit room
- Studio page also calls this endpoint on `beforeunload` (best-effort; not
  guaranteed if tab is force-closed)
- Guest SSE connections receive `{ type: 'STUDIO_ENDED' }` → redirect to a
  "Studio has ended" page

---

## Chat Aggregation Architecture

### Per-Platform Connectors (server-side, per room)

**Twitch** (`tmi.js`):

```ts
// Initiated when host starts studio with Twitch connected
const client = new tmi.Client({ channels: [channelName] });
client.on('message', (channel, tags, message) => publishChat({ platform: 'twitch', ... }));
```

**YouTube** (REST polling, every 20s minimum):

```ts
// Uses stored OAuth tokens from PlatformConnection
// Fetches liveChatId from active broadcast, then polls liveChatMessages
GET https://youtube.googleapis.com/youtube/v3/liveChat/messages?liveChatId=...
```

> **Quota note:** `liveChatMessages.list` costs ~5 quota units/call. At 20s
> intervals, a 3-hour stream costs ~2,700 units — well within the 10,000/day
> free quota for a single room. Do NOT reduce below 15s polling interval. If
> multiple rooms are active simultaneously, the shared quota depletes
> proportionally.

**Kick** (Pusher WebSocket, public):

```ts
// Kick exposes chat via Pusher channels — no auth needed
const pusher = new Pusher("32cbd69e4b950bf97679", { cluster: "us2" });
const channel = pusher.subscribe(`channel.${channelId}`);
channel.bind("App\\Events\\ChatMessageEvent", handler);
```

**TikTok** (`tiktok-live-connector`, unofficial — best-effort):

```ts
const connection = new WebcastPushConnection(username);
connection.on('chat', (data) => publishChat({ platform: 'tiktok', ... }));
```

> **Reliability warning:** `tiktok-live-connector` reverse-engineers TikTok's
> internal WebSocket protocol. TikTok actively rate-limits and blocks server IPs
> using this technique. It may work locally but fail in production. Treat TikTok
> chat as best-effort. If the connection fails, the studio continues working —
> TikTok chat is simply unavailable for that session. Do not block studio
> startup on TikTok connectivity.

### Normalized Chat Message Format

```ts
interface ChatMessage {
  id: string;
  platform: "youtube" | "twitch" | "kick" | "tiktok";
  author: {
    name: string;
    avatar?: string;
    color?: string; // Twitch user color
    badges?: string[]; // Twitch badges (sub, mod, etc.)
  };
  message: string;
  timestamp: Date;
}
```

### Message Delivery Pipeline

```
Platform API/WebSocket
       ↓
Server-side connector (per platform per room)
       ↓
Normalize to ChatMessage
       ↓
Publish to Upstash Redis Pub/Sub (room:{code}:chat)
       ↓
SSE endpoint (/api/rooms/{code}/stream) subscribes to Redis channel
       ↓
All studio participants receive messages via their SSE connection
       ↓
Zustand chat store updates → ChatPanel re-renders
```

---

## SSE Endpoint

`GET /api/rooms/[code]/stream`

**Runtime: Edge** — this route must export `export const runtime = 'edge'` so
Vercel does not apply the serverless function timeout (Vercel Hobby serverless
times out at 10s; Edge runtime has no hard timeout for streaming responses).

Returns a `text/event-stream` response. Subscribes to both Upstash Redis
channels using the `@upstash/redis` REST client (HTTP-based, compatible with
Edge):

- `room:{code}:chat` → streams chat messages
- `room:{code}:events` → streams guest requests/admission events

```ts
// route.ts
export const runtime = 'edge'

// Event types sent over SSE:
{ type: 'CHAT_MESSAGE', data: ChatMessage }
{ type: 'GUEST_REQUEST', data: { guestId, name } }
{ type: 'GUEST_ADMITTED', data: { guestId, token } }
{ type: 'GUEST_DENIED', data: { guestId } }
{ type: 'GUEST_LEFT', data: { participantId } }
```

---

## Studio UI Layout

```
┌──────────────────────────────────────────┬──────────────────┐
│                                          │  CHAT PANEL      │
│        VIDEO GRID (up to 6 tiles)        │                  │
│                                          │  [YT] Username   │
│  ┌──────────┐  ┌──────────┐             │  message here    │
│  │ HOST     │  │ Guest 1  │             │                  │
│  │ (you)    │  │ [ON SCR] │             │  [TW] Username   │
│  └──────────┘  └──────────┘             │  another msg     │
│  ┌──────────┐  ┌──────────┐             │                  │
│  │ Guest 2  │  │ Guest 3  │             │  [KI] Username   │
│  │ [OFF SCR]│  │ [ON SCR] │             │  yet another     │
│  └──────────┘  └──────────┘             │                  │
│                                          │  [TT] Username   │
├──────────────────────────────────────────┤  tiktok msg      │
│ 🎤 📷 🖥️ | app.com/join/ABC123 [Copy]  │                  │
└──────────────────────────────────────────┴──────────────────┘
```

**Video Grid behavior:**

- 1 participant → single tile full width
- 2 → side by side
- 3–4 → 2×2 grid
- 5–6 → 2×3 grid
- Off-screen guests: tile shows "Off Screen" label, video hidden

**Chat Panel:**

- Platform badge (colored icon) per message: YouTube red, Twitch purple, Kick
  green, TikTok black
- Auto-scrolls to latest message
- Platform filter buttons at top to show/hide specific platforms

---

## File Structure

```
Clone-Zerocast/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # Landing page
│   │   ├── login/page.tsx                   # NextAuth sign-in
│   │   ├── dashboard/page.tsx               # Host dashboard
│   │   ├── settings/platforms/page.tsx      # Connect platforms
│   │   ├── studio/[code]/page.tsx           # Host studio
│   │   ├── join/[code]/page.tsx             # Guest join page
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │       ├── rooms/
│   │       │   ├── route.ts                 # POST: create room
│   │       │   └── [code]/
│   │       │       ├── token/route.ts       # GET: host token
│   │       │       ├── request/route.ts     # POST: guest join request
│   │       │       ├── admit/route.ts       # POST: host admits guest (enforces 6-person limit)
│   │       │       ├── deny/route.ts        # POST: host denies guest
│   │       │       ├── end/route.ts         # POST: host ends studio (teardown connectors)
│   │       │       └── stream/route.ts      # GET: SSE endpoint (Edge runtime)
│   │       └── platforms/
│   │           ├── connect/route.ts         # POST: save platform connection
│   │           └── disconnect/route.ts      # DELETE: remove platform connection
│   ├── components/
│   │   ├── studio/
│   │   │   ├── StudioLayout.tsx             # Root studio page layout
│   │   │   ├── VideoGrid.tsx                # Auto-arranging video grid
│   │   │   ├── VideoTile.tsx                # Single participant tile + controls
│   │   │   ├── ControlBar.tsx               # Mic/cam/screen share + invite link
│   │   │   ├── GuestRequestToast.tsx        # Admit/deny notification popup
│   │   │   └── InviteLink.tsx               # Copy invite link widget
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx                # Scrollable chat container
│   │   │   ├── ChatMessage.tsx              # Single message row
│   │   │   ├── PlatformBadge.tsx            # Colored platform icon
│   │   │   └── PlatformFilter.tsx           # Toggle per-platform visibility
│   │   └── dashboard/
│   │       ├── RoomCard.tsx                 # Past/active room card
│   │       └── PlatformConnectionCard.tsx   # Connected platform status card
│   ├── lib/
│   │   ├── livekit.ts                       # Token generation helpers
│   │   ├── redis.ts                         # Upstash client + helpers
│   │   ├── prisma.ts                        # Prisma client singleton
│   │   └── chat/
│   │       ├── types.ts                     # ChatMessage interface
│   │       ├── normalize.ts                 # Per-platform → ChatMessage normalization
│   │       ├── twitch.ts                    # tmi.js connector
│   │       ├── youtube.ts                   # YouTube Live Chat API poller
│   │       ├── kick.ts                      # Kick Pusher connector
│   │       └── tiktok.ts                    # tiktok-live-connector wrapper
│   ├── store/
│   │   ├── chat.ts                          # Zustand: chat messages + platform filters
│   │   └── studio.ts                        # Zustand: on/off-screen state, guest list
│   └── auth.ts                              # NextAuth.js config
├── prisma/
│   └── schema.prisma
├── package.json
└── next.config.ts
```

---

## Platform Connection Flow (Settings Page)

### Twitch / Kick / TikTok

Simple form: user enters their channel name / username → saved to
`PlatformConnection` in Neon. No OAuth needed (all use public APIs).

### YouTube

OAuth via Google (NextAuth already handles this). After sign-in, Google provides
an access token scoped to `https://www.googleapis.com/auth/youtube.readonly`
(sufficient for `liveBroadcasts.list` and `liveChatMessages.list`). Stored in
`PlatformConnection`. When the studio starts, the server uses this token to:

1. Find the user's active live broadcast (`liveBroadcasts.list`)
2. Get the `liveChatId`
3. Begin polling `liveChatMessages.list` every 20 seconds (see quota note in
   Chat Aggregation section)

---

## Key Libraries

```json
{
  "livekit-server-sdk": "^2.x",
  "@livekit/components-react": "^2.x",
  "next-auth": "^5.x",
  "@prisma/client": "^5.x",
  "@upstash/redis": "^1.x",
  "tmi.js": "^1.x",
  "tiktok-live-connector": "^1.x",
  "zustand": "^5.x",
  "pusher-js": "^8.x"
}
```

---

## Platforms Roadmap

| Platform    | Phase 1 (Launch) | Phase 2 (Later)  |
| ----------- | ---------------- | ---------------- |
| YouTube     | Chat aggregation | RTMP streaming   |
| Twitch      | Chat aggregation | RTMP streaming   |
| Kick        | Chat aggregation | RTMP streaming   |
| TikTok      | Chat aggregation | RTMP streaming   |
| X (Twitter) | —                | Chat + streaming |
| Instagram   | —                | Chat + streaming |

---

## Known Limitations

| Limitation                                | Impact                                          | Mitigation / Future fix                                      |
| ----------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| On/off-screen state is client-only        | Refreshing the studio loses toggle state        | Acceptable for Phase 1; sync to Redis in Phase 2             |
| TikTok chat is best-effort                | TikTok may block server-side scraping           | Studio works without it; TikTok is non-blocking              |
| YouTube chat quota: 10,000 units/day      | Multiple concurrent rooms deplete quota faster  | Poll at 20s minimum; add per-user API key support later      |
| `beforeunload` is not guaranteed          | Chat connectors may leak if tab is force-closed | Redis TTL on room keys (auto-expire after 24h) as safety net |
| Guest 6-person limit enforced server-side | No UI feedback while request is pending         | Return 400 with message; show "Room is full" toast           |

---

## Verification Plan

### Manual testing checklist:

1. Sign up / sign in via Google OAuth
2. Connect Twitch channel name in `/settings/platforms`
3. Create a new studio → redirected to `/studio/[code]`
4. Copy invite link → open in incognito → enter guest name → request to join
5. Approve guest in host's studio → guest appears in video grid
6. Toggle guest "Off Screen" → tile hides
7. Twitch chat messages appear in the chat panel with purple badge
8. Platform filter buttons hide/show per-platform messages

### Environment variables required:

```
# LiveKit
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
NEXT_PUBLIC_LIVEKIT_URL=

# Neon
DATABASE_URL=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Google OAuth (for NextAuth + YouTube API)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```
