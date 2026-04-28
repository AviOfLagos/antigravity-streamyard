# Zerocast

A browser-based live streaming studio inspired by StreamYard. Create rooms, invite guests, and go live to YouTube, Twitch, Kick, TikTok, and custom RTMP destinations — all from the browser.

**Stack:** Next.js 15 (App Router) + React 19 + LiveKit + Neon Postgres + Upstash Redis + Tailwind CSS v4

## Features

| Category | Features |
|----------|----------|
| **Studio** | Video grid with 5 layout presets (Grid, Spotlight, Screen+Grid, Screen Only, Single), backstage/on-stage toggling, speaking ring indicators |
| **Audio** | Mic level VU meters (Web Audio AnalyserNode), device selector (mic/camera/speaker) for host and guest, echo cancellation, noise suppression, auto-gain |
| **Guests** | Join link with device preview, approval queue, auto-admit mode, 30s denial cooldown, room-full detection, 3-minute timeout |
| **Moderation** | Mute/unmute guest mic and camera, kick participants, backstage management |
| **Chat** | Multi-platform aggregation (YouTube, Twitch, Kick, TikTok), send messages to YouTube/Twitch, Super Chats, Bits/Cheers, gifts, subs, raids, follows |
| **Streaming** | Multi-platform RTMP streaming via LiveKit Egress, custom RTMP destinations, broadcast title + description |
| **Auth** | Google OAuth via NextAuth.js, session-based + LiveKit JWT dual auth |
| **Data** | Guest lead capture (email + name), session summaries with stats, platform activity charts |

## Architecture

```
Browser ──WebRTC──▶ LiveKit SFU ──RTMP──▶ YouTube / Twitch / Kick / TikTok
   │                    │
   │ SSE (real-time)    │ Room events
   ▼                    ▼
Next.js API ◄──────▶ Upstash Redis (events, chat relay, rate limiting, caching)
   │
   ▼
Neon Postgres (users, rooms, participants, platform connections, stream sessions)
```

- **LiveKit** — SFU (Selective Forwarding Unit) for WebRTC audio/video. Each participant sends once; server forwards to others.
- **Upstash Redis** — SSE event bus, chat message relay, session state cache (60s TTL), rate limiting.
- **Neon Postgres** — Persistent data via Prisma ORM. Free-tier resilient with 3-layer retry + exponential backoff.

## Project Structure

```
src/
├── app/
│   ├── api/rooms/[code]/     # Room API (admit, deny, kick, mute, stream, chat, etc.)
│   ├── api/platforms/        # Platform connection management
│   ├── api/feedback/         # User feedback
│   ├── studio/[code]/        # Host studio page
│   ├── join/[code]/          # Guest join flow (preview → request → studio)
│   ├── demo/[code]/          # Demo mode (no auth required)
│   ├── dashboard/            # Room creation & management
│   ├── settings/platforms/   # Platform connection settings (stream keys, OAuth)
│   ├── session-summary/      # Post-session stats & sharing
│   ├── changelog/            # Version changelog (v0.1.0 → v1.4.0)
│   └── status/               # Live system status (DB, Redis, LiveKit health checks)
├── components/
│   ├── studio/               # VideoGrid, VideoTile, ControlBar, DeviceSelector, AudioLevelIndicator, GoLivePanel, BackstagePanel
│   ├── chat/                 # ChatPanel, PlatformBadge, chat message components
│   ├── dashboard/            # Room cards, creation modal
│   └── ui/                   # shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
├── lib/
│   ├── livekit.ts            # LiveKit server SDK (tokens, room management, mute, kick)
│   ├── prisma.ts             # Prisma client with Neon retry wrapper
│   ├── redis.ts              # Upstash Redis client
│   ├── chat/                 # Platform chat connectors (YouTube, Twitch, Kick, TikTok)
│   └── schemas/              # Zod validation schemas
├── store/                    # Zustand stores (studio state, chat state)
└── prisma/
    └── schema.prisma         # Database schema (User, Room, Participant, PlatformConnection, StreamSession, GuestLead, CustomRtmpDestination)
```

## Getting Started

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) Postgres database
- An [Upstash](https://upstash.com) Redis instance
- A [LiveKit Cloud](https://livekit.io) project (or self-hosted LiveKit server)
- Google OAuth credentials (for sign-in)

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/AviOfLagos/antigravity-streamyard.git
   cd antigravity-streamyard
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the following:
   ```env
   # Database (Neon Postgres)
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."

   # Auth
   NEXTAUTH_SECRET="your-secret"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."

   # LiveKit
   NEXT_PUBLIC_LIVEKIT_URL="wss://your-project.livekit.cloud"
   LIVEKIT_API_KEY="..."
   LIVEKIT_API_SECRET="..."

   # Redis (Upstash)
   UPSTASH_REDIS_REST_URL="https://..."
   UPSTASH_REDIS_REST_TOKEN="..."
   ```

3. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Start the dev server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

The app is configured for Vercel deployment. The build command (`prisma migrate deploy && next build`) runs migrations automatically.

```bash
vercel --prod
```

Ensure all environment variables are set in your Vercel project settings.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/rooms/[code]/request` | POST | Guest requests to join |
| `/api/rooms/[code]/admit` | POST | Host admits a guest |
| `/api/rooms/[code]/deny` | POST | Host denies a guest |
| `/api/rooms/[code]/kick` | POST | Host kicks a participant |
| `/api/rooms/[code]/mute` | POST | Host mutes/unmutes guest mic or camera |
| `/api/rooms/[code]/stream` | GET | SSE event stream (chat, guest events, stream status) |
| `/api/rooms/[code]/stream-live` | POST/DELETE | Start/stop RTMP streaming |
| `/api/rooms/[code]/chat/connect` | POST | Start platform chat connectors |
| `/api/rooms/[code]/chat/send` | POST | Send message to platform chat |
| `/api/rooms/[code]/end` | POST | End the studio session |
| `/api/rooms/[code]/leave` | POST | Guest leaves the studio |
| `/api/rooms/[code]/state` | GET/PUT | Read/write studio layout state |
| `/api/rooms/[code]/platforms` | GET | List connected platforms for a room |
| `/api/platforms` | GET/POST/DELETE | Manage platform connections (stream keys) |
| `/api/status` | GET | System health check (JSON) |
| `/api/feedback` | POST | Submit user feedback |

## Testing

```bash
npm test              # Run all tests (114 tests)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router), React 19 |
| WebRTC | LiveKit (SFU) via `@livekit/components-react` |
| Database | Neon Postgres via Prisma ORM |
| Cache/Events | Upstash Redis (SSE bus, rate limiting, caching) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Styling | Tailwind CSS v4, shadcn/ui, Radix UI |
| State | Zustand |
| Validation | Zod |
| Testing | Vitest |

## Changelog

See [/changelog](https://zerocast.vercel.app/changelog) or `src/app/changelog/page.tsx`.

Current version: **v1.4.0** (Apr 28, 2026)

## License

Private project.
