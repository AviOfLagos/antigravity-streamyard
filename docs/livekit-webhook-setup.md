# LiveKit egress webhook — prod setup

Required to activate F-24 (per-platform stream-drop detection +
one-click reconnect) in production. Without this, when one platform
fails mid-stream, the host gets no banner and the destination silently
stays dead.

## What this is

`src/app/api/webhooks/livekit/route.ts` is already shipped and verifies
signed payloads via `WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)`.
It needs LiveKit to POST egress events to our endpoint URL. That URL is
**not** auto-discovered — it must be set in the LiveKit project dashboard.

## Steps

1. Sign in at https://cloud.livekit.io and open the Zerocast project.
2. Left nav → **Settings** → **Webhooks**.
3. Click **Add webhook URL** (or **Edit** if one exists).
4. Paste the prod URL:
   ```
   https://zerocast.vercel.app/api/webhooks/livekit
   ```
   - Replace `zerocast.vercel.app` with whatever the prod domain
     resolves to (custom domain takes precedence over the Vercel
     subdomain).
   - For preview deployments, you'd point at the preview URL of the
     branch — only useful for end-to-end testing, not normal flow.
5. **Auth**: no separate webhook secret is needed. The LiveKit SDK signs
   the payload with the same `LIVEKIT_API_SECRET` we already use to
   mint host tokens. Our handler verifies via the existing env vars.
6. **Events to subscribe to**:
   - `egress_started`
   - `egress_updated`  ← the important one for F-24
   - `egress_ended`
   - (Room / participant / track events optional; we don't act on them
     yet.)
7. **Save**.

## How to verify

After saving, go live to YouTube + Twitch in parallel. Then kill the
YouTube broadcast from YouTube Studio while keeping Twitch running.
Inside ~30s you should see a pinned red banner in the studio header:

> YouTube stopped accepting your stream.  [Reconnect]  [×]

If nothing shows up, check in this order:

- `vercel logs` for `POST /api/webhooks/livekit` — should show 200s
  every time LiveKit publishes an egress update.
- 401 on those requests → signature verification failed →
  `LIVEKIT_API_SECRET` mismatch between LiveKit project and Vercel env.
- Logs missing entirely → webhook URL typo in the LiveKit dashboard.

## Dedup behaviour (don't be surprised by this)

The handler dedupes per `(egressId, platform)` in Redis for 60s, so a
flood of `egress_updated` events for the same FAILED destination only
produces one banner. If you dismiss the banner via the X button, the
60s flag stays in place — you won't be re-prompted within that window
even if LiveKit keeps re-publishing. New drops on the same platform
after the window do show a fresh banner.

## Reconnect endpoint

The Reconnect action in the banner POSTs to
`/api/rooms/<code>/stream-live/reconnect` with `{ platform }`. That
route re-reads the host's `PlatformConnection` (handles stream-key
rotation on the platform side) and calls LiveKit `updateStream` to
re-add the destination. Host-only, rate-limited at 10/min/IP under
the `rooms:reconnect` bucket.

## Skip steps when not deploying

If the prod app isn't yet deployed at a stable URL, this doc is the
checklist for "first thing to do after first prod deploy." Until then
F-24 still works in development if you point LiveKit at a tunnelled
local URL (ngrok / cloudflared) — same dashboard steps, different URL.

## Cross-references

- Code: `src/app/api/webhooks/livekit/route.ts`
- Reconnect: `src/app/api/rooms/[code]/stream-live/reconnect/route.ts`
- Frontend: `src/app/studio/[code]/StudioClient.tsx` (case
  `PLATFORM_STREAM_DROPPED` in `handleSSEEvent`)
- Changelog: v2.7.0 entry under "Per-Platform Stream Drop Detection +
  Reconnect"
