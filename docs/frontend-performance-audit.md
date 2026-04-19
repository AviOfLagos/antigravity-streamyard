# Frontend Performance Audit — Zerocast

**Date:** 2026-04-19
**Severity Scale:** Critical > High > Medium > Low

---

## Critical Issues

### 1. Zustand Store Subscriptions Without Selectors
Components subscribe to entire store objects instead of individual values. Any store change re-renders all subscribers.

| File | Line | Store Properties |
|------|------|-----------------|
| `src/components/studio/VideoGrid.tsx` | :31 | `onScreenParticipantIds, activeLayout, pinnedParticipantId` |
| `src/components/studio/BackstagePanel.tsx` | :73 | `onScreenParticipantIds` |
| `src/components/studio/GuestRequestToast.tsx` | :16 | `pendingGuests, removePendingGuest` |
| `src/components/chat/ChatPanel.tsx` | :19 | `filteredMessages()` called every render |

**Fix:** Use individual selectors with shallow comparison:
```ts
const layout = useStudioStore((s) => s.activeLayout)
const pinnedId = useStudioStore((s) => s.pinnedParticipantId)
```

### 2. Missing React.memo on List Items
Components that render per-item in lists re-render on any parent change:
- `VideoTile.tsx` — renders per participant
- `ChatMessage.tsx` — renders per message (up to 500)
- `BackstagePanel.tsx:13-65` — `ParticipantRow` inline component

**Fix:** Wrap with `React.memo()`.

### 3. SSE PING Causes Render Churn Every Second
`StudioClient.tsx:93` calls `setSseOk(true)` on every SSE message including PINGs. This re-renders the entire studio component tree every 1 second.

**Fix:** Only set state when value changes:
```ts
es.onmessage = (e) => {
  setSseOk((prev) => prev || true) // or just check before setting
}
```

### 4. EventSource Memory Leak
`StudioClient.tsx:102` — useEffect with `handleSSEEvent` in deps recreates EventSource on every dependency change without closing the previous one. Multiple SSE connections accumulate.

**Fix:** Use ref for EventSource, close previous before creating new.

---

## High Issues

### 5. LiveKit Bundle Not Code-Split (~400KB+)
- `layout.tsx:4` — `@livekit/components-styles` imported globally (all pages get LiveKit CSS)
- `StudioClient.tsx:5` — LiveKit components loaded without `next/dynamic`

**Fix:** Dynamic import StudioClient, move LiveKit styles to studio layout.

### 6. No Suspense Boundaries
- `studio/[code]/page.tsx` — no Suspense wrapping StudioClient
- `dashboard/page.tsx` — sequential DB queries block page render

**Fix:** Add `<Suspense fallback={<Loading />}>` around async sections.

### 7. No Chat Virtualization
`ChatPanel.tsx:43-59` — renders all 500 messages as DOM nodes. Only ~10 are visible.

**Fix:** Use `@tanstack/react-virtual` or `react-window`.

### 8. Unmomoized Filtering in VideoGrid
`VideoGrid.tsx:34-42` — 4 chained `.filter()` calls on tracks array run on every render.

**Fix:** Wrap in `useMemo` with proper deps.

---

## Medium Issues

### 9. Sequential Dashboard DB Queries
`dashboard/page.tsx:30-41` — rooms and platforms fetched sequentially.

**Fix:** `Promise.all([prisma.room.findMany(...), prisma.platformConnection.findMany(...)])` — Neon handles parallel fine with connection pooler.

### 10. Platform Data Fetched Client-Side
`StudioClient.tsx:59-66` — fetches `/api/rooms/${code}/platforms` on mount.

**Fix:** Fetch server-side in studio page.tsx and pass as props.

### 11. Inline Style Calculations
`StudioClient.tsx:145`, `PlatformFilter.tsx:27-30` — computed on every render.

**Fix:** Memoize or use CSS classes.

### 12. Unused Zustand Properties
`studio.ts:12,22-24` — `onScreen`, `toggleOnScreen`, `setOnScreen` are legacy dead code.

**Fix:** Remove.

### 13. No Error Boundary
Studio page has no error boundary. LiveKit failure = white screen.

**Fix:** Add React Error Boundary with fallback UI.

---

## Quick Wins (< 30 min each)

1. Add `React.memo` to VideoTile, ChatMessage, ParticipantRow
2. Fix `setSseOk` to only update on change
3. Add `useMemo` to VideoGrid track filtering
4. Remove dead store properties
5. Move LiveKit styles import to studio layout
6. Parallel dashboard queries

## Larger Efforts

1. Dynamic import LiveKit components (~2 hours)
2. Add react-virtual to ChatPanel (~2 hours)
3. Refactor Zustand to selector pattern (~3 hours)
4. Add Suspense boundaries + loading states (~2 hours)
5. Server-side platform data fetch (~1 hour)
