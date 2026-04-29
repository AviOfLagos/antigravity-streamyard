# Phase 1: Bug Fixes + Chat Polish — Design Spec

**Date:** 2026-04-29
**Version:** v1.5.0
**Status:** In Progress

## Overview

Fix broken chat UX, make the UI responsive, and resolve YouTube duplicate ingestion. Six work items, four independent workstreams.

## Work Items

### W1: Chat Filter — Connected Platforms Only + Logos

**Problem:** `PlatformFilter.tsx` hardcodes all 4 platforms. All pills appear active even when only YouTube is connected.

**Design:**
- ChatPanel receives `connectedPlatforms` prop (already available in StudioClient as `connectedPlatforms` state)
- PlatformFilter renders only connected platforms (not all 4)
- Each pill shows the platform's SVG logo (reuse from GoLivePanel) instead of text
- Connected platforms get a green ring (`ring-2 ring-emerald-400`)
- Unconnected platforms hidden from filter (they have no messages anyway)
- Update PlatformBadge to use SVG logos too

**Files:** `PlatformFilter.tsx`, `PlatformBadge.tsx`, `ChatPanel.tsx`, `StudioClient.tsx`

### W2: Host Chat Echo — Sent Messages Appear in Chat

**Problem:** Host sends a message via `/api/rooms/{roomCode}/chat/send` but it never appears in the local chat store.

**Design:**
- After successful send, construct a chat message object matching the store schema
- Add it to `useChatStore` with `platform: "host"`, `author: hostName`, `text: message`
- Show with a distinct "You" badge or host styling
- Also publish the sent message via SSE so guests see it too (currently only platform messages flow through SSE)

**Files:** `ChatPanel.tsx` (ChatInput component), `chat.ts` store, `chat/send/route.ts`

### W3: YouTube Duplicate Ingestion Fix

**Problem:** YouTube warns "More than one ingestion is using the primary URL" when host has poor network and LiveKit egress reconnects.

**Design:**
- In the stream-live API, pass YouTube's backup ingest URL as fallback
- PlatformConnection model already has `ingestUrl` field — use it for backup URL
- Add "Backup Server URL" field to YouTube platform settings (Settings > Platforms)
- When starting egress, prefer primary URL; if egress restarts, use backup
- In GoLivePanel, show a note about backup URL when YouTube is selected

**Files:** `stream-live/route.ts`, `GoLivePanel.tsx`, Settings platform page

### W4: Responsive Chat — Collapsible + Control Bar Visible

**Problem:** On small screens, GoLive and End buttons hidden behind the chat panel. Chat panel can't be closed.

**Design:**
- Add collapse/expand toggle button to chat panel header
- When collapsed: show floating chat badge with unread count at top-right
- Chat panel bottom must clear the control bar: `pb-[calc(theme(spacing.14)+env(safe-area-inset-bottom))]` or use flex layout
- StudioClient: chat panel slides in/out (already has mobile toggle — extend to all breakpoints)
- GuestStudio: same treatment — add chat toggle button in header
- LayoutSelector hidden on `sm` breakpoint (currently always visible, wastes space on mobile)

**Files:** `ChatPanel.tsx`, `StudioClient.tsx`, `GuestStudio.tsx`, `ControlBar.tsx`

## Architecture Notes

- All 4 workstreams touch different primary files — can be developed in parallel
- W1 and W2 both touch `ChatPanel.tsx` but in different sections (filter vs input)
- No database migrations needed
- No new dependencies

## Success Criteria

1. Chat filter only shows platforms that are actually connected to the room
2. Platform pills have SVG logos and green ring when connected
3. Host-sent messages appear in the chat window immediately
4. YouTube backup URL supported to prevent duplicate ingestion warnings
5. Chat panel collapsible on all screen sizes
6. Control bar always visible (never hidden behind chat)
7. Build passes, no regressions
