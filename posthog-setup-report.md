<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Zerocast. The integration covers both client-side and server-side event tracking, PostHog initialization via `instrumentation-client.ts`, a reverse-proxy rewrite configuration in `next.config.ts`, a shared server-side client in `src/lib/posthog-server.ts`, environment variable configuration in `.env.local`, and error tracking via `capture_exceptions: true`.

## Summary of changes

| File | Change |
|------|--------|
| `instrumentation-client.ts` | Created — initializes PostHog client-side with `/ingest` proxy, `capture_exceptions`, and debug mode |
| `src/lib/posthog-server.ts` | Created — singleton `getPostHogClient()` for server-side event capture |
| `next.config.ts` | Added `/ingest/*` and `/ingest/static/*` rewrites + `skipTrailingSlashRedirect: true` |
| `.env.local` | Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` |

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `studio_created` | Host successfully creates a new studio room | `src/components/dashboard/CreateStudioButton.tsx` |
| `studio_entered` | Host clicks "Enter Studio" from the creation confirmation modal | `src/components/dashboard/CreateStudioButton.tsx` |
| `invite_link_copied` | Host copies the guest invite link | `src/components/dashboard/CreateStudioButton.tsx` |
| `stream_started` | Host successfully starts a live stream | `src/components/studio/GoLivePanel.tsx` |
| `stream_stopped` | Host stops an active live stream | `src/components/studio/GoLivePanel.tsx` |
| `feedback_submitted` | User submits a feedback form | `src/app/feedback/page.tsx` |
| `guest_join_requested` | Guest submits their name and requests to join a studio | `src/app/join/[code]/JoinClient.tsx` |
| `session_summary_viewed` | User views the post-session summary page | `src/app/session-summary/[code]/SessionSummaryClient.tsx` |
| `platform_connected` | User connects a streaming platform — server-side | `src/app/api/platforms/connect/route.ts` |
| `room_created` | Server-side: new room persisted in the database | `src/app/api/rooms/route.ts` |
| `stream_live_started` | Server-side: LiveKit egress starts, room transitions to LIVE | `src/app/api/rooms/[code]/stream-live/route.ts` |
| `session_ended` | Server-side: host ends a studio session with duration/participant/message stats | `src/app/api/rooms/[code]/end/route.ts` |

## Next steps

We've built a dashboard and five insights to monitor user behavior:

- [Analytics basics dashboard](/dashboard/1577761)
- [Studio Creation Funnel](/insights/MZnSssOp) — conversion from room_created → studio_entered → stream_live_started
- [Studios Created Over Time](/insights/1EnlYMki) — daily trend of new studios
- [Live Streams Started Over Time](/insights/2pHupiJ6) — daily trend of streams going live
- [Guest Join Request Funnel](/insights/vGeYoOpu) — guest_join_requested → session_summary_viewed
- [Host Streaming Retention](/insights/Qm2ekP4d) — weekly retention for hosts who go live

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
