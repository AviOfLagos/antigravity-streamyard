# SPEC

Caveman-encoded invariants. Edit when adding/changing load-bearing behavior. Read before coding.

## §I — Interfaces

```
env: DATABASE_URL ! set, append `connection_limit=1` for serverless
env: DIRECT_URL ! set, bypasses Neon pooler, used by `prisma migrate deploy`
env: NEXT_PUBLIC_LIVEKIT_URL ! `wss://` (browser) → server SDK rewrites to `https://`
env: LIVEKIT_API_KEY & LIVEKIT_API_SECRET ! both set or token mint fails silent
env: UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN ! set, fail-open if absent
env: NEXTAUTH_SECRET ! ≥32 chars, JWT strategy
env: GEMINI_API_KEY ? absent → AI chat disabled server-side
env: NEXT_PUBLIC_SITE_URL ? fallback `https://zerocast.vercel.app`

api: POST /api/rooms → 201 {code,token} | 401 | 429
api: POST /api/rooms/[code]/{admit,deny,kick,mute,end,leave,record,stream-live}
api: GET  /api/rooms/[code]/stream → SSE event bus (legacy; v1.9 migrated→LiveKit data channels)
api: POST /api/rooms/[code]/chat/{connect,send,guest-send,ai-respond}
api: GET  /api/rooms/[code]/state | PUT same
api: POST /api/beta → 201 | 409 dup | 429
api: GET  /api/status → JSON health (DB, Redis, LiveKit)
api: ∀ mutating routes → auth() ! && rate-limit guard

identity: `host-<userId>`     ∀ host
identity: `guest-<guestId>`   ∀ guest
∴ mute/kick/sendData target these strings exact

livekit-room: emptyTimeout=300s, maxParticipants=6 (1 host + 5 guests)
livekit-sdk: `toJwt()` async @ v2.x → ! await
```

## §V — Invariants

```
V1:  NextAuth session strategy = "jwt" ! ⊥ "database"
     Why: Edge middleware (src/middleware.ts) ⊥ Prisma → DB sessions → ∞ redirect /login.

V2:  ∀ Prisma op → retry on {P1001,P1002,P1008,P1017} & "Can't reach database server"
     Max attempts: 3, base delay 500ms, exp backoff. See src/lib/prisma.ts.

V3:  ∀ Upstash rate limit → fail-open on Redis error
     Why: Redis outage ⊥ block legit users. See checkRateLimit() try/catch.

V4:  ∀ user-input string → sanitize via stripHtml() in Zod transform
     ! at schema boundary, ⊥ in handlers. See src/lib/sanitize.ts + src/lib/schemas/.

V5:  ∀ Redis key on room scope → sadd → `room:<code>:_keys`
     Why: deleteRoomKeys() needs Set membership for cleanup on room end.

V6:  PlatformType enum upper-case in DB
     ∀ user input → `.toUpperCase()` before insert. {YOUTUBE,TWITCH,KICK,TIKTOK}.

V7:  ∀ <Link href="?beta=true"> → ! scroll={false}
     Why: default Next.js Link scroll-to-top on nav → kills modal UX (beta modal opens via query param).

V8:  ∀ marketing CTA / nav / footer → live under src/app/(marketing)/
     Route group → bypasses authed layout.

V9:  ∀ Prisma DATABASE_URL → ?connection_limit=1 appended (serverless)
     ⊥ strip. Vercel functions ⊥ open > 1 conn per invocation.

V10: ∀ Page route w/ params @ Next 15 → params: Promise<…> + await
     Old API: `params: {…}` typed object broke build at type-check.

V11: ∀ Page metadata → `metadataBase` set (root layout) for OG/Twitter URLs
     Relative URLs ⊥ work on Twitter/LinkedIn preview without metadataBase.

V12: ∀ public marketing page → `export const metadata` w/ `alternates.canonical`
     ⊥ omit → duplicate-content risk.

V13: ∀ JSON-LD <script type="application/ld+json"> → real data only
     ⊥ fake aggregateRating, ⊥ fake reviewCount → Google manual action risk.

V14: ∀ failing 3rd-party component on marketing → wrap <SafeBoundary>
     Why: one widget crash ⊥ kill page. See src/components/SafeBoundary.tsx.

V15: studio composite canvas = 1920×1080 logical px. Preview = transform:scale fit; egress = native render.
     ∀ slot coord ∈ src/lib/layout/presets.ts → % of canvas. ⊥ raw px on slots.
     Why: single renderer drives host preview + (future) egress composite → pixel-identical output.

V16: ∀ stage tile placement → slot resolver in CompositeStage:
       pinnedParticipantId → slot 0
       else host-* identity → slot 0
       else tileOrder[0] → slot 0
       remaining cameras fill via tileOrder, then natural connect order
       screenshare → preset.screenshareSlot if defined
     ⊥ CSS grid reflow. ⊥ flex-N layout branches.

V17: ∀ useConnectionQualityIndicator() (LK components-react v2.9.x) → ! pass {participant: localParticipant}
     Why: no-arg call → useEnsureParticipant throws "No participant provided" outside ParticipantContext.
     See B7.

V18: ∀ LK egress (RTMP & recording) → customBaseUrl = `${SITE_URL}/composite/${roomCode}`
     ⊥ built-in `layout: "grid"` template. Why: built-in ignores our custom layout, overlays, tile order — host preview ≠ viewer composite. /composite/[code] is public, validates egress-issued JWT in URL query (no NextAuth).

V19: Recording storage = Cloudflare R2 (S3-compatible). EncodedFileOutput.s3 = S3Upload(R2 creds). forcePathStyle: true. region: "auto".
     ⊥ LiveKit local disk (cloud egress has none). presigned URL TTL = 24h via @aws-sdk/s3-request-presigner; refresh on session-summary load if endedAt > 24h ago.

V20: LayoutBroadcaster payload → ! include tileOrder + onScreenParticipantIds
     ! rebroadcast on participants.length growth (composite egress worker = late subscriber).
     Why: drag-reorder result must propagate to composite, else preview ≠ recording.
```

## §B — Bugs (historical, fixed)

```
id |date       |cause                                                      |fix
B1 |2026-05-12 |AnimatedChatWidget interval pushed `undefined` past array  |guard `const next=ARR[i]; if(next)…` + filter Boolean in map. V14 → wrap SafeBoundary.
B2 |2026-05-12 |Beta modal scroll-jacks to top on open                     |scroll={false} on all 13 <Link href="?beta=true">. V7.
B3 |2026-05-12 |Marketing page.tsx extra </div> @ line 216                 |delete extra closer. Build was failing on JSX syntax.
B4 |2026-05-12 |Webpack `__webpack_modules__[id] not a function` in dev    |stale .next cache after client-component edits. ∴ kill dev server + rm -rf .next + restart.
B5 |2026-05-12 |blog/[slug] params typed `{slug:string}` broke Next 15    |`params: Promise<{slug:string}>` + await. V10.
B6 |2026-05-12 |Build failed: prisma migrate deploy needs DATABASE_URL    |.env.local dummy + `build:next` script skips migrate.
B7 |2026-05-13 |Studio "Something went wrong" — useConnectionQualityIndicator() no-arg throws outside ParticipantContext on LK components-react v2.9.20 |pass {participant: localParticipant}. V17.
B8 |2026-05-13 |Studio "Something went wrong" #2 — stale dev server cached DATABASE_URL=dummy after .env.local update |kill + restart dev server. B6 carry-over.
B9 |2026-05-13 |Φ2 cavecrew-builder subagent false-claimed LayoutBroadcaster widen + composite withPlaceholder fix without applying |always re-grep claimed edits before promoting to QA. patched inline.
```

## §T — Tasks (open / WIP / done since v2.0)

```
id |status|task                                                |cites
T1 |x     |robots.txt + sitemap.xml routes                     |§I
T2 |x     |metadataBase + site-wide OG/Twitter                 |V11
T3 |x     |homepage metadata + canonical                       |V12
T4 |x     |Organization + SoftwareApplication JSON-LD          |V13
T5 |x     |FAQPage JSON-LD (12 questions, competitor-targeted) |V13
T6 |x     |Footer marquee animation                            |
T7 |x     |/pricing                                            |V12
T8 |x     |/compare/{restream,riverside,streamlabs}-alternative|V12
T9 |x     |/use-cases/{podcasters,educators,churches,gamers}   |V12
T10|x     |/glossary/{multistreaming,rtmp}                     |V12
T11|x     |/tools/bitrate-calculator                           |V12
T12|x     |opengraph-image dynamic (ImageResponse, edge)       |V11
T13|x     |Inter font display:swap                             |
T14|x     |blog/[slug] generateMetadata                        |V10,V12
T15|x     |MemPalace install + mine + MCP register             |§§Tools
T16|.     |Set NEXT_PUBLIC_SITE_URL in Vercel prod env         |§I
T17|.     |/blog/[slug] real content (MDX or CMS, not slug→title) |
T18|.     |More glossary: sfu-vs-mcu, webrtc-streaming, low-latency-streaming |V12
T19|.     |More tools: stream-key-generator, rtmp-tester, aspect-ratio-calculator |
T20|.     |Platform deep-dives: /integrations/{youtube-live,twitch,kick,tiktok-live} |
T21|.     |Per-track local recording (Riverside-parity)        |
T22|.     |4K live egress (gated by destination platform caps) |
T23|x     |Layout Φ1: 1920×1080 canvas + 10 presets + slot resolver |V15,V16
T24|x     |Drag-reorder backstage (dnd-kit pointer + keyboard)  |V16
T25|x     |Layout Φ2: composite egress template /composite/[code] + R2 storage + recordingUrl on StreamSession |V15,V18,V19
T26|.     |Layout Φ2: GuestStudio → reuse <CompositeStage>, drop guest-side grid branches |V15,V16
T27|~     |Layout Φ3 omnibus — broken into T35 ✓ + T36 + T37 + T55 + T56 (sub-tasks below)
T28|.     |Tile drag-reorder on stage canvas — dup of T37 (use T37 only) |V16
T29|x     |Custom Egress Template for RTMP egress (replaces built-in "grid") |V15,V18
T30|x     |Φ2: /composite/[code] route + LK subscriber + LayoutHydrator |V18
T31|x     |Φ2: R2 wiring (egress.ts + r2.ts presigned URL helper) |V19
T32|x     |Φ2: StreamSession.{recordingPath,recordingUrl} + record route persistence |V19
T33|x     |Φ2: SessionSummary "Download recording" w/ stale-URL refresh |V19
T34|x     |Φ2: LayoutBroadcaster widen (tileOrder, rebroadcast on participant join) |V20
T35|x     |Φ3: lower-thirds rendered into composite (name labels baked in) — VideoTile gradient bar w/ clamp() font, commit 6d12f2c
T36|.     |Φ3: per-platform aspect (TikTok 9:16 canvas variant) — add 1080×1920 vertical preset set + per-egress canvas selector + composite route accepts ?aspect=9x16
T37|.     |Φ3: stage-tile drag-reorder (transform-aware sensors) — wrap dnd-kit PointerSensor to divide pointer delta by transform:scale ratio before passing to onDragMove; current backstage drag works (no scale)
T38|x     |Φ2.1: write fresh presigned URL back to DB to skip re-mint on next load (cost) — recordingUrlMintedAt field + 23h freshness check, commit f17e07a |V19
T39|x     |robots.ts AI bot allowlist (15 crawlers: GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot, Perplexity-User, ClaudeBot, Claude-Web, anthropic-ai, Google-Extended, cohere-ai, Applebot-Extended, Bytespider, meta-externalagent, Diffbot, FacebookBot) + /admin disallow |
T40|x     |sitemap.ts real lastModified per route (git mtime → fs stat → now fallback chain, memoized Map at module init) |
T41|x     |public/llms.txt llmstxt.org spec + public/llms-full.txt 5.4K-word corpus (12 sections, no caveman) |
T42|x     |Phase-1 swarm: 12 strategy docs (~46K w) under /doc/ — SEO playbook, event taxonomy, launch checklist, competitive landscape, brand voice, PostHog dashboards, PH launch, directories, Reddit drafts, YouTube plan, guest pitches, X+LinkedIn threads |
T43|x     |Phase 2: PostHog marketing-funnel captures — BetaModal {opened,submitted,success,error,duplicate,closed,field_focused}, MarketingNav marketing_nav_clicked, Footer footer_link_clicked, FaqSection faq_question_opened, BetaCta cta_clicked. Reconciled to taxonomy doc §10.1.
T44|x     |Phase 3: BetaRequest schema ext — referrer, utm_*, landingPage, userAgent, country, region, city, posthogDistinctId (Vercel edge headers + body) + frontend attribution capture w/ first-touch + last-touch localStorage (src/lib/attribution.ts)
T45|x     |Phase 3: PostHog identify on NextAuth signin (provider + isNewUser surfaced on session via jwt+session callbacks; resend→email map). alias() dropped per posthog-js >=1.200 auto-merge.
T46|x     |Phase 3: /admin/{analytics,funnel,sources,posthog} + admin/abuse (Phase 4). Sub-nav strip on all 5.
T47|x     |Phase 4: RateLimitHit model + persistence in checkRateLimit (fire-and-forget, fail-open preserved). /admin/abuse w/ spike chart. Vercel Speed Insights mounted in root layout.
T48|x     |Phase 5: Slack realtime pipe — src/lib/slack.ts (357 ln, postToSlack + postBetaSignup + postStreamStarted + postAlert + postDigest), drop-ins on 4 event surfaces (/api/beta, /api/rooms/[code]/stream-live, instrumentation.ts onRequestError chain, src/lib/rate-limit.ts spike detector >20 hits/5min), /admin/slack test panel + /api/admin/slack-test handler. Fail-soft when SLACK_WEBHOOK_* env unset. Fingerprint dedup 60s + per-URL throttle 200ms. Weekly digest helper shipped (cron deferred — see T78).
T49|x     |Cleanup: delete /public/llm.txt (singular, superseded by /public/llms.txt plural per llmstxt.org spec)
T50|.     |Decide: apex domain (custom vs `zerocast.vercel.app`), founder real-name disclosure in public docs, parent company display, public support email
T51|x     |Phase 4: Sentry server+edge only (sentry.{server,edge}.config.ts + instrumentation.ts + next.config.ts wrap). Client errors stay with PostHog. tracesSampleRate 0.1 prod. beforeSend filters retryable Prisma errors. Source maps deleted after upload.
T52|.     |queryFunnel tighten — current HogQL ignores per-step `properties` filter + `conversionWindowDays`; counts users hitting events anywhere in date window, no ordering. Activation funnel's `is_new_user=true` filter is dropped → step 1 inflated. Rewrite with windowed self-joins.
T53|.     |Refactor 26 rate-limit callers to pass rateLimitContextFromRequest(req) so RateLimitHit rows carry route/method/UA/country instead of null.
T54|.     |Set env vars in Vercel prod env: NEXT_PUBLIC_SITE_URL, POSTHOG_PROJECT_ID, POSTHOG_PERSONAL_API_KEY, POSTHOG_DASHBOARD_* (6 iframe slots), SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN.
T55|.     |Pre-existing bug: src/app/api/platforms/stream-key/route.ts uses limiter type "platforms:stream-key" — not in LIMITER_CONFIGS, falls through fail-open, never throttles. Add to configs.
T56|.     |User feature doc: <placeholder — user noted one feature to document; awaiting details>
T57|x     |Build blocker fix: src/store/chat.ts filters Record + `twitter: true` line. Commit 900eb54 — unblocks all unpushed commits including 978cd31 / e2cddb9. Also bundled: record-keeping migration 20260516080000_add_attribution_twitter_ratelimit + entities.json rename Zerocast-clone → Zerocast + changelog v2.8.0 entry.
T66|.     |changelog v2.8.0 dedup: X (Twitter) Live bullet + Twitch JOIN forward + YT/Kick first-chat-proxy mentions now duplicate v2.9.0 (parallel split them out). Strip from v2.8.0 since v2.9.0 owns them.
T67|x     |Push to origin/main complete (2026-05-17). 14 commits landed including 900eb54 + ea791b1 (parallel v2.9.0 + webhook doc + vitest) + 220889f (admin allow-list). origin/main = 220889f.
T68|~     |Secret rotation (user owns, IN-PROGRESS): LiveKit API key+secret, Neon DATABASE_URL password, Upstash REST token. Exposed in git history pre-e96c925. Push exposes git history publicly via GitHub.
T69|.     |LiveKit Cloud → Webhooks: set prod URL `https://<prod-domain>/api/webhooks/livekit`. Without this, F-24 per-platform drop detection silently never fires in prod (LK egress webhooks just go nowhere).
T70|.     |Vitest coverage remaining libs — parallel started 2026-05-16 (viewer-counts.test.ts + egress.test.ts + recap.test.ts staged at handoff). Still pending: src/lib/{public-urls,host-auth,attribution,posthog-query}.ts + src/components/studio/useJoinDeltas (if extracted). Extend coverage scope in vitest.config.ts to src/lib/**.
T71|.     |X Live UI smoke-test: /settings/platforms Twitter card end-to-end (Premium gate copy + ingest URL + key inputs), manual Go Live in Media Studio Producer flow, public URL fallback to https://x.com/<slug>, viewer-count null branch renders correctly in studio header. Add screenshot to docs/launch/ if it ships clean.
T58|.     |Smoke-test recording end-to-end on prod — host studio → Record → 30s → Stop → session-summary Download button → file plays. Localhost can't be reached by LK egress workers, so this only works on preview/prod deploys. Blocks confidence in Φ2.
T59|.     |Vercel auto-deploy lag audit — pushes to main weren't producing fresh deploys for >20h (observed 2026-05-14..15). Check GitHub→Vercel webhook health; verify "Auto-deploy from main" flag in project settings; re-link Git integration if needed.
T60|.     |Audit `NEXT_PUBLIC_SITE_URL` value on Vercel prod env — composite egress URL is `${SITE_URL}/composite/${roomCode}`; if SITE_URL points at a stale alias, recording + RTMP composite silently break. SPEC V18.
T61|x     |Bug: JoinClient SSE missing guestId query param → 401 → "Connection interrupted" banner, retry useless. Fixed: append `&guestId=<id>` to EventSource URL, commit 90e2329.
T62|.     |Extract stuck-room sweep into scripts/end-stuck-rooms.mjs — currently a one-off inline Node script. Should set status=ENDED, call lk.deleteRoom, wipe Redis `room:<code>:*` keys via the tracked `_keys` Set. Idempotent. Reads .env.local.
T63|.     |T36 starter: vertical canvas preset set — 1080×1920 (9:16) variant of LAYOUT_PRESETS keyed under a separate `VERTICAL_LAYOUT_PRESETS` Map. CompositeStage picks the right Map from a new `?aspect=9x16` query param OR a new `canvasAspect` store field. Egress for TikTok routes to /composite/[code]?aspect=9x16. Minimum 4 vertical presets: solo, two-stacked, three-stacked, four-grid-vertical.
T64|.     |T37 starter: transform-aware drag sensor — wrap dnd-kit's PointerSensor; on each pointer event, divide deltaX/deltaY by the canvas's current `transform: scale()` ratio. Read scale via `getComputedStyle(canvasEl).transform` matrix decomposition OR set a CSS var `--canvas-scale` at render time and read via `parseFloat(getComputedStyle(...).getPropertyValue('--canvas-scale'))`. Test at 6-grid (smallest tiles) to confirm drop coords align.
T65|.     |Cost optimization (Φ2.2): set up R2 public bucket domain (Cloudflare custom domain) and populate `R2_PUBLIC_URL` env → recording downloads bypass presigned URL flow entirely, become stable forever-URLs, zero S3 sign cost.
T72|.     |Slack webhooks — create 4 incoming webhooks at api.slack.com/apps (channels #beta-signups, #streams, #alerts, #digest), paste URLs into Vercel env (SLACK_WEBHOOK_BETA_SIGNUPS / _STREAMS / _ALERTS / _DIGEST). Each unset = that channel goes dark, others keep working.
T73|.     |Slack admin: factor SUB_NAV into shared src/app/admin/_components/SubNav.tsx — 6 admin sub-pages each redeclare the strip, drift already exists (analytics 4 entries, abuse 5, slack 6).
T74|.     |Slack: add link button to /admin/streams/[roomCode] in postStreamStarted once that route exists (currently omitted — admin streams page not built).
T75|.     |Slack: replace prisma.user.findUnique lookup in /api/rooms/[code]/stream-live Slack block with a hostId-based postStreamStarted signature so the extra DB roundtrip on every Go Live drops.
T76|.     |Slack: index RateLimitHit on (identifier, createdAt) — spike check fires a count() per 429, single-column index on identifier exists but compound on createdAt would speed sliding-window range queries.
T77|.     |Slack: PostHog dashboard slot env vars (POSTHOG_DASHBOARD_{ACQUISITION,BETA_FUNNEL,ACTIVATION,ENGAGEMENT,RETENTION,PRODUCT_HEALTH}) — create the 6 dashboards in PostHog UI, click Share → public link → set in Vercel. Until set /admin/posthog iframe slots render placeholder cards.
T78|.     |Slack: weekly digest cron — postDigest() helper shipped; needs a Vercel cron route (e.g. /api/cron/weekly-digest) hitting Friday 8am UTC + pulling metrics from posthog-query + Prisma + firing postDigest({ range: "weekly", metrics }).
T79|.     |Sentry NEXT_PUBLIC_SENTRY_DSN — auto-added by Vercel↔Sentry integration but unused (PostHog owns client errors per A4.1 brief). Either remove from Vercel env or document the duplication intent.
T80|.     |.env.example cleanup: drop R2_PUBLIC_URL stub (line 97). Code never reads it; only blocking T65 future use.

Status: x done, ~ wip, . todo
```

## §F — Fan-out plan for resuming this branch

If picking the canvas/recording arc back up via sub-agents, dispatch like this:

```
Lane A (independent, can fan out 3-wide):
  T58 — smoke-test recording on prod        →  general-purpose, browser+log
  T62 — extract end-stuck-rooms.mjs         →  cavecrew-builder, single new file
  T64 — wrap dnd-kit sensor for T37 prep    →  general-purpose, 2 files

Lane B (sequential, after Lane A's T58 lands):
  T63 → T36   — vertical preset set + composite ?aspect routing
  T37         — uses T64's sensor wrapper to make stage drag work

Lane C (ops, independent):
  T59 — audit GitHub→Vercel webhook
  T60 — audit NEXT_PUBLIC_SITE_URL
  T65 — set up R2 public domain (optional Φ2.2)

Master coordination:
  - Each lane should commit + push independently. Never `git add -A`.
  - QA agent (cavecrew-reviewer) runs after each lane's last commit.
  - Tests gate: `npx vitest run` + `npx tsc --noEmit` must be green before push.
  - Recording smoke (T58) blocks T26 (GuestStudio refactor) — don't ship guest
    composite reuse until egress is verified working on prod.
```

## §§Tools

```
mempalace: $HOME/Library/Python/3.9/bin/mempalace  (! prepend to PATH per shell)
  mempalace search "<query>" → top-k hybrid (cosine + BM25)
  mempalace status           → drawer counts by room
  mempalace mine .           → re-mine after substantive code changes
  MCP server registered → tools available as mempalace_*

caveman: skill loaded. Applies to SPEC.md, spec-adjacent writes, backprop entries.
  ⊥ apply to: code, error strings, commit msgs, PR descriptions, user-facing docs.
  cavecrew agents: investigator (code locator), builder (1-2 file edit), reviewer (diff review). All compress output ~60%.

seo skills installed: seo-audit, programmatic-seo, ai-seo, web-quality-skills/seo
  Use programmatic-seo for batch /use-cases/* and /glossary/* generation.
```

## §§Architecture quick-ref

```
Browser ─WebRTC→ LiveKit SFU ─RTMP→ {YouTube,Twitch,Kick,TikTok,custom-RTMP}
   │                  │
   ↓                  ↓
Next.js API ←──→ Upstash Redis (event bus, chat relay, rate limit, room cache)
   ↓
Neon Postgres (Prisma ORM w/ V2 retry)

Marketing (route group): src/app/(marketing)/ → public, no auth.
Studio:                  src/app/studio/[code]/ → host UI, auth required.
Guest:                   src/app/join/[code]/ → preview→request→studio.
Demo:                    src/app/demo/[code]/ → no-auth demo.
```
