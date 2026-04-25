# Neon DB Resilience Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate "Can't reach database server" errors caused by Neon free tier cold starts and connection exhaustion.

**Architecture:** Three-layer defense — (1) connection string tuning for Neon cold starts, (2) Prisma retry middleware for transient failures, (3) Redis room cache to eliminate 80% of DB reads. All layers are independent and fail gracefully.

**Tech Stack:** Prisma Client Extensions, Upstash Redis (existing), Neon Postgres (existing)

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `.env.local` | Connection string params |
| Modify | `src/lib/prisma.ts` | Add retry extension |
| Create | `src/lib/room-cache.ts` | Redis-backed room cache (get/set/invalidate) |
| Modify | `src/app/join/[code]/page.tsx` | Use cached room lookup |
| Modify | `src/app/studio/[code]/page.tsx` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/request/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/admit/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/deny/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/end/route.ts` | Use cached room lookup + invalidate |
| Modify | `src/app/api/rooms/[code]/leave/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/state/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/platforms/route.ts` | Use cached room lookup |
| Modify | `src/app/api/rooms/[code]/stream-live/route.ts` | Use cached room lookup + invalidate on status change |
| Modify | `src/app/api/rooms/[code]/chat/connect/route.ts` | Use cached room lookup |
| Modify | `src/app/demo/[code]/page.tsx` | Use cached room lookup |
| Modify | `src/app/api/rooms/route.ts` | Warm cache on room create |

---

## Task 1: Fix Connection String

**Files:**
- Modify: `.env.local`

- [ ] **Step 1: Update DATABASE_URL connection params**

Change:
```
connection_limit=1&pool_timeout=30
```
To:
```
connection_limit=5&pool_timeout=30&connect_timeout=30
```

`connect_timeout=30` gives Neon up to 30 seconds to wake from cold start (default is ~5s which times out). `connection_limit=5` allows concurrent requests through PgBouncer (Neon free tier supports this).

- [ ] **Step 2: Verify the app starts with new connection string**

Run: `npx next dev --port 3001`
Expected: Server starts without connection errors

- [ ] **Step 3: Commit**

```bash
git add .env.local
git commit -m "fix: increase Neon connect timeout and connection limit for cold starts"
```

---

## Task 2: Add Prisma Retry Middleware

**Files:**
- Modify: `src/lib/prisma.ts`

- [ ] **Step 1: Implement retry extension**

Replace `src/lib/prisma.ts` with a version that wraps all Prisma operations in retry logic using `$extends`. The retry catches connection errors (P1001, P1002, P1008, P1017 and "Can't reach database server" messages) and retries with exponential backoff: 500ms, 1000ms, 2000ms (3 attempts max).

```typescript
import { Prisma, PrismaClient } from "@prisma/client"

const RETRYABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017"])
const MAX_RETRIES = 3
const BASE_DELAY_MS = 500

function isRetryable(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_CODES.has(error.code)
  }
  if (error instanceof Error && error.message.includes("Can't reach database server")) {
    return true
  }
  return false
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withRetry(client: PrismaClient): PrismaClient {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          try {
            return await query(args)
          } catch (error) {
            if (attempt < MAX_RETRIES - 1 && isRetryable(error)) {
              const delay = BASE_DELAY_MS * Math.pow(2, attempt)
              console.warn(
                `[Prisma] Retryable error (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`,
                error instanceof Error ? error.message : error,
              )
              await sleep(delay)
              continue
            }
            throw error
          }
        }
        // Unreachable, but satisfies TS
        throw new Error("Prisma retry exhausted")
      },
    },
  }) as unknown as PrismaClient
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient(): PrismaClient {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
  return withRetry(base)
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
```

Note: removed `"query"` from dev logs — it floods the console and makes real errors hard to spot.

- [ ] **Step 2: Verify the app compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/prisma.ts
git commit -m "fix: add Prisma retry middleware for Neon cold start resilience"
```

---

## Task 3: Create Room Cache Layer

**Files:**
- Create: `src/lib/room-cache.ts`

- [ ] **Step 1: Create the room cache module**

This module wraps `prisma.room.findUnique({ where: { code } })` with a 60-second Redis cache. On cache miss, it fetches from DB and caches the result. On Redis failure, it falls through to DB directly.

```typescript
import type { Room } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"

const ROOM_CACHE_TTL = 60 // seconds

function cacheKey(code: string) {
  return `cache:room:${code}`
}

/**
 * Get a room by code — Redis cache first, DB fallback.
 * Returns null if the room doesn't exist.
 */
export async function getCachedRoom(code: string): Promise<Room | null> {
  // Try Redis first
  try {
    const cached = await redis.get(cacheKey(code))
    if (cached) {
      const data = typeof cached === "string" ? JSON.parse(cached) : cached
      // Rehydrate Date fields that were serialized as ISO strings
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        endedAt: data.endedAt ? new Date(data.endedAt) : null,
      } as Room
    }
  } catch {
    // Redis unavailable — fall through to DB
  }

  // Cache miss — fetch from DB
  const room = await prisma.room.findUnique({ where: { code } })
  if (!room) return null

  // Warm cache (best-effort)
  try {
    await redis.set(cacheKey(code), JSON.stringify(room), { ex: ROOM_CACHE_TTL })
  } catch {
    // Non-critical — next request will retry
  }

  return room
}

/**
 * Invalidate cached room after status changes (end, go-live, etc.).
 */
export async function invalidateRoomCache(code: string): Promise<void> {
  try {
    await redis.del(cacheKey(code))
  } catch {
    // Non-critical
  }
}

/**
 * Warm the cache after creating or updating a room.
 */
export async function warmRoomCache(code: string, room: Room): Promise<void> {
  try {
    await redis.set(cacheKey(code), JSON.stringify(room), { ex: ROOM_CACHE_TTL })
  } catch {
    // Non-critical
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/room-cache.ts
git commit -m "feat: add Redis-backed room cache layer to reduce Neon DB load"
```

---

## Task 4: Wire Up Room Cache Across All Routes

**Files:**
- Modify: All routes listed in the file structure table above

The change is mechanical and identical everywhere: replace `prisma.room.findUnique({ where: { code } })` with `getCachedRoom(code)`. Add cache invalidation where room status changes.

- [ ] **Step 1: Update page-level server components**

In these files, replace `import { prisma } from "@/lib/prisma"` usage for room lookup with `getCachedRoom`:

**`src/app/join/[code]/page.tsx`:**
- Add import: `import { getCachedRoom } from "@/lib/room-cache"`
- Replace: `const room = await prisma.room.findUnique({ where: { code } })`
- With: `const room = await getCachedRoom(code)`
- Keep the `prisma` import only if used for other queries (it is not here — remove it)

**`src/app/studio/[code]/page.tsx`:**
- Add import: `import { getCachedRoom } from "@/lib/room-cache"`
- Replace: `const room = await prisma.room.findUnique({ where: { code } })`
- With: `const room = await getCachedRoom(code)`
- Keep `prisma` import — still used for `platformConnection.findMany`

**`src/app/demo/[code]/page.tsx`:**
- Add import: `import { getCachedRoom } from "@/lib/room-cache"`
- Replace: `const room = await prisma.room.findUnique({ where: { code } })`
- With: `const room = await getCachedRoom(code)`

- [ ] **Step 2: Update API routes (read-only room lookups)**

Same pattern for each. Replace `prisma.room.findUnique({ where: { code } })` with `getCachedRoom(code)`. Remove `prisma` import if no longer used in that file.

Files:
- `src/app/api/rooms/[code]/request/route.ts`
- `src/app/api/rooms/[code]/admit/route.ts`
- `src/app/api/rooms/[code]/deny/route.ts`
- `src/app/api/rooms/[code]/leave/route.ts`
- `src/app/api/rooms/[code]/state/route.ts` (both GET and PUT handlers use it)
- `src/app/api/rooms/[code]/platforms/route.ts`
- `src/app/api/rooms/[code]/chat/connect/route.ts`

- [ ] **Step 3: Update routes that mutate room status (add invalidation)**

**`src/app/api/rooms/[code]/end/route.ts`:**
- Add import: `import { getCachedRoom, invalidateRoomCache } from "@/lib/room-cache"`
- Replace room lookup with `getCachedRoom(code)`
- After `prisma.room.updateMany(...)` succeeds, call `await invalidateRoomCache(code)`

**`src/app/api/rooms/[code]/stream-live/route.ts`:**
- Add import: `import { getCachedRoom, invalidateRoomCache } from "@/lib/room-cache"`
- Replace all `prisma.room.findUnique({ where: { code } })` calls with `getCachedRoom(code)`
- After every `prisma.room.update(...)` call, add `await invalidateRoomCache(code)`

- [ ] **Step 4: Warm cache on room creation**

**`src/app/api/rooms/route.ts`:**
- Add import: `import { warmRoomCache } from "@/lib/room-cache"`
- After `prisma.room.create(...)`, call `await warmRoomCache(room.code, room)`

- [ ] **Step 5: Verify full build**

Run: `npx next build 2>&1 | tail -10`
Expected: Build succeeds with no new errors

- [ ] **Step 6: Commit**

```bash
git add src/app/join/[code]/page.tsx src/app/studio/[code]/page.tsx src/app/demo/[code]/page.tsx \
  src/app/api/rooms/
git commit -m "fix: wire room cache across all routes to reduce DB load by ~80%"
```

---

## Task 5: Verify End-to-End

- [ ] **Step 1: Start dev server**

Run: `npx next dev --port 3000`

- [ ] **Step 2: Test room creation flow**

1. Login and create a room from dashboard
2. Verify studio page loads (room is fetched and cached)
3. Open join page in incognito — should load from cache, no DB hit

- [ ] **Step 3: Test cold start resilience**

1. Wait for Neon to suspend (~5 min idle)
2. Hit any room page
3. Should succeed after retry (watch console for `[Prisma] Retryable error` messages)

- [ ] **Step 4: Final commit with all changes**

Ensure all files are committed and the build is clean.
