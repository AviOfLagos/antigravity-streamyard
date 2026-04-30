# Zerocast Product & Infrastructure Audit — v1.8.0

**Date:** April 29, 2026
**Auditor:** Claude Opus 4.6 (God-level product test)

## Executive Summary

Zerocast is well-structured with good error handling, type safety, and polished UI. The critical weakness is the **real-time architecture**: SSE-over-Redis-polling on serverless is the wrong pattern. Fix: move real-time to LiveKit data channels (already used for layout sync). Self-host on Hetzner ($7-15/mo) instead of managed services ($100+/mo).

## Critical Issues

| # | Issue | File | Impact |
|---|-------|------|--------|
| C1 | SSE polls Redis every 1s with LRANGE 0 -1 (full list scan) | stream/route.ts | Exhausts Upstash free tier in 25 min |
| C2 | Chat connectors are in-memory singletons on serverless | chat/*.ts | Connectors randomly stop, leak across lambda instances |
| C3 | `deleteRoomKeys` uses `KEYS` command (O(N) full scan) | redis.ts:52 | Latency spikes at scale |
| C4 | Guest chat endpoint has zero auth | chat/guest-send/route.ts | Anyone can spam any room's chat |
| C5 | SSE has no room membership verification | stream/route.ts | Anyone can read all events by room code |
| C6 | `setTimeout` in end route never fires on serverless | end/route.ts:139 | Redis keys never cleaned up |

## Cost Comparison (200 concurrent users)

| | Managed (Current) | Self-Hosted |
|---|---|---|
| LiveKit | $48/mo (Cloud) | $0 (open source) |
| Postgres | $19/mo (Neon) | $0 (self-hosted) |
| Redis | $10-30/mo (Upstash) | $0 (self-hosted) |
| Hosting | $20/mo (Vercel Pro) | $7-15/mo (Hetzner VPS) |
| **Total** | **$97-117/mo** | **$7-15/mo** |

## Framework Verdict

**Keep Next.js** for web app. **Move real-time to LiveKit data channels** (Option A — zero new infrastructure). Already used for layout sync; extend to chat + events. Eliminates SSE route entirely.

## Top 10 Recommendations

1. Replace SSE polling with LiveKit data channels (2-3 days)
2. Add auth to guest-send and SSE endpoints (1 day)
3. Self-host on Hetzner for 85% cost savings (1-2 days)
4. Replace `KEYS` with explicit key tracking (1 hour)
5. Fix `setTimeout` in end route — delete keys immediately (30 min)
6. Call `stopConnectors` when ending a room (15 min)
7. Add `connection_limit=1` to Prisma datasource (5 min)
8. Add rate limiting to guest-send and record (15 min)
9. Persist chat via LiveKit data channel instead of Redis lists (reduce commands 95%)
10. Add mobile navigation hamburger menu (1 hour)
