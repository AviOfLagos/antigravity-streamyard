# Zerocast QA Test Plan v1.2.0

## Overview

Zerocast is a browser-based live streaming studio. This document covers all testable features, expected behaviors, and edge cases for QA testers.

**Base URL**: `http://localhost:3000` (dev) or your deployed URL

---

## 1. Authentication

### 1.1 Google OAuth Sign-In
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Sign in with Google | Click "Sign In" → Select Google account | Redirected to `/dashboard` |
| 2 | Sign in persists | Close tab → Reopen `/dashboard` | Still signed in |
| 3 | Protected routes redirect | Visit `/dashboard` without session | Redirected to `/login` |
| 4 | Sign out | Click avatar → Sign Out | Redirected to `/login` |

### 1.2 Protected Routes
All of these should redirect to `/login` when not authenticated:
- `/dashboard`
- `/settings/platforms`
- `/studio/{code}`
- `/session-summary/{code}`

---

## 2. Dashboard

### 2.1 Create Studio
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Create with title | Click "Create Studio" → Enter title → Create | Room created, code shown, invite link visible |
| 2 | Create without title | Leave title empty | Create button disabled |
| 3 | Select platforms | Check YouTube/Twitch checkboxes | Platforms shown in confirmation |
| 4 | Auto-admit toggle | Select "Auto-admit" radio | Room created with auto-admit enabled |
| 5 | Manual approval default | Don't change access control | "Manual approval" is pre-selected |
| 6 | Copy invite link | Click "Copy" on invite URL | URL copied to clipboard, button shows "Copied!" |
| 7 | Enter studio | Click "Enter Studio" | Navigated to `/studio/{code}` |

### 2.2 Room List
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | See rooms | Create multiple rooms | All rooms listed with status badges |
| 2 | LOBBY room | Room not yet started | Shows "Ready" + "Enter Studio" button |
| 3 | LIVE room | Room currently live | Shows "Live" + "Rejoin Live" button |
| 4 | ENDED room | Room that was ended | Shows "Ended" + "Summary" link |

---

## 3. Guest Join Flow

### 3.1 Join Form (`/join/{code}`)
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Enter name | Type display name → Continue | Proceeds to device preview |
| 2 | Enter email (optional) | Type email in optional field | Accepted, no account created |
| 3 | Invalid email | Type "not-an-email" | Validation error shown |
| 4 | Empty name | Leave name empty | Continue button disabled |
| 5 | HTML in name | Enter `<b>Alice</b>` | Stripped to "Alice" |

### 3.2 Device Preview
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Camera preview | Allow camera permission | Video preview shown |
| 2 | Mic preview | Allow mic permission | Mic indicator active |
| 3 | Toggle camera off | Click camera toggle | Preview shows camera-off avatar |
| 4 | Toggle mic off | Click mic toggle | Mic indicator changes to off |
| 5 | Permission denied | Block camera/mic permissions | Warning shown, can still join |
| 6 | Request to join | Click "Request to Join" | Moves to waiting state |

### 3.3 Waiting Room
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Wait for host | After requesting | Animated waiting indicator shown |
| 2 | Host admits | Host clicks Admit | Guest transitions to studio |
| 3 | Host denies | Host clicks Deny | Shows "Not admitted" with 30s cooldown |
| 4 | Timeout | Wait 3 minutes without response | Timeout message with retry options |
| 5 | Room full | 6 participants already in room | Shows "Room is full" message |
| 6 | Room ended | Host ends while waiting | Redirected to `/studio-ended` |
| 7 | Duplicate name | Request with same name twice | "Already have a pending request" error |

### 3.4 Auto-Admit Flow
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Auto-admit enabled | Join a room with auto-admit on | Skip waiting, join immediately |
| 2 | No host approval needed | Guest requests to join | No toast shown to host, guest enters directly |

---

## 4. Studio (Host View)

### 4.1 Video & Layout
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Host video shown | Enter studio | Own camera visible in grid |
| 2 | Grid layout (default) | Multiple participants | Equal-sized tiles in grid |
| 3 | Spotlight layout | Switch to Spotlight | One large + sidebar tiles |
| 4 | Screen+Grid | Switch + share screen | Screen large, cameras small below |
| 5 | Screen Only | Switch to Screen Only | Only screen shares visible |
| 6 | Single layout | Switch to Single | One participant fills view |
| 7 | Speaking indicator | Speak into mic | Violet ring on active speaker |
| 8 | Camera off avatar | Turn camera off | Initial letter avatar shown |

### 4.2 Controls
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Toggle mic | Click mic button | Mic on/off state changes |
| 2 | Toggle camera | Click camera button | Camera on/off state changes |
| 3 | Screen share | Click screen button | Screen share prompt appears |
| 4 | Invite link | Click invite link area | Copyable invite URL shown |
| 5 | End studio | Click End → Confirm | Redirected to session summary |

### 4.3 Guest Management
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Guest request toast | Guest requests to join | Toast appears top-right with Admit/Deny |
| 2 | Admit guest | Click Admit on toast | Guest enters studio, toast removed |
| 3 | Deny guest | Click X on toast | Guest sees denial, toast removed |
| 4 | Admit error (room full) | Try to admit 7th person | Error toast: "Room is full" |
| 5 | Participant count | Guests join/leave | Count updates in stage area |
| 6 | Backstage panel | Multiple participants | All shown in backstage strip |
| 7 | Empty backstage | Only host in room | Shows "No guests yet" message |

### 4.4 Host Moderation
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Mute guest mic | Click mic icon on ParticipantRow | Guest's mic muted |
| 2 | Unmute guest mic | Click mic-off icon | Guest's mic unmuted |
| 3 | Disable guest camera | Click camera icon | Guest's camera turned off |
| 4 | Kick guest | Click X icon → Confirm | Guest removed, shows leave toast |
| 5 | Cannot kick self | Host row | No kick button shown for host |
| 6 | Host badge | Host in participant strip | Star badge shown next to name |
| 7 | Stage/backstage toggle | Click Stage/Backstage button | Participant moved on/off screen |

### 4.5 Chat Panel
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Messages appear | Platform connectors active | Chat messages stream in |
| 2 | Platform filter | Toggle platform pills | Only selected platforms shown |
| 3 | Auto-scroll | New messages arrive | Panel scrolls to bottom |
| 4 | Scroll-up pause | Scroll up manually | "New messages" pill appears |
| 5 | Donation display | Super Chat/Bits arrive | Yellow highlight with amount badge |
| 6 | Subscription display | Sub event arrives | Violet highlight with tier info |
| 7 | Follow display | Follow event arrives | Green highlight |
| 8 | Raid display | Raid event arrives | Blue highlight with viewer count |
| 9 | Reply context | Twitch reply arrives | "replying to {author}" shown above message |
| 10 | Send message | Type in chat input → Enter | Message sent to YouTube + Twitch |
| 11 | Empty send | Press Enter with empty input | Nothing happens |

### 4.6 Streaming (Go Live)
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Start stream | Click Go Live → Select platforms | LIVE badge appears in header |
| 2 | Stop stream | Click Stop while live | LIVE badge removed |
| 3 | Add platform mid-stream | Add platform while live | Toast: "Added {platform} to stream" |
| 4 | Remove platform mid-stream | Remove platform while live | Toast: "Removed {platform}" |
| 5 | Stream error | Platform connection fails | Error toast with details |

---

## 5. Guest Studio View

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Video grid | Admitted to studio | All participants visible |
| 2 | Mic toggle | Click mic button | Mic on/off |
| 3 | Camera toggle | Click camera button | Camera on/off |
| 4 | Leave studio | Click Leave | Redirected to `/studio-ended` |
| 5 | Studio ended by host | Host ends session | Guest redirected to `/studio-ended` |
| 6 | Participant count | Other guests join/leave | Count updates in header |
| 7 | Chat visible | Desktop view | Chat panel visible on right side |

---

## 6. Platform Settings (`/settings/platforms`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Connect platform | Enter channel name → Connect | Platform shown as connected |
| 2 | Set stream key | Enter RTMP stream key | Key saved (masked in UI) |
| 3 | Disconnect platform | Click Disconnect | Platform removed |
| 4 | View connected | Visit page | All connected platforms listed |

---

## 7. Session Summary (`/session-summary/{code}`)

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | View after end | End a studio → View summary | Duration, participant count, message count shown |
| 2 | Share to social | Click X or LinkedIn share | Pre-filled share link opens |
| 3 | Copy stats | Click copy button | Stats copied to clipboard |
| 4 | Host-only access | Non-host visits URL | Unauthorized / redirected |

---

## 8. Public Pages

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Landing page | Visit `/` | Hero, features, how-it-works, CTA sections |
| 2 | Changelog | Visit `/changelog` | All versions from v0.1.0 to v1.2.0 |
| 3 | Status | Visit `/status` | Service health checks, feature status list |
| 4 | Feedback | Visit `/feedback` | Bug/feature/general form |
| 5 | Submit feedback | Fill form → Submit | Success confirmation |
| 6 | Nav links | Click Changelog/Status/Feedback | All navigate correctly |

---

## 9. Edge Cases & Error Handling

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| 1 | Invalid room code | Visit `/join/!!!` | Error shown |
| 2 | Ended room join | Visit `/join/{ended-code}` | "Studio has ended" message |
| 3 | Tab reload in studio | Refresh browser tab | Studio reconnects, session preserved |
| 4 | Network disconnect | Kill internet briefly | "Connection lost" overlay, auto-reconnect |
| 5 | SSE connection error | Redis unavailable | Banner: "Connection interrupted" |
| 6 | Rate limiting | Spam guest requests (>3/min) | 429 error with retry-after |
| 7 | Concurrent admit | Two hosts admit simultaneously | Only one succeeds, other gets error |
| 8 | Browser audio autoplay | Join studio in fresh tab | "Click to enable audio" button appears if blocked |

---

## 10. Cross-Browser & Responsive

| # | Test Case | Browser/Device | Expected |
|---|-----------|---------------|----------|
| 1 | Chrome desktop | Chrome latest | Full functionality |
| 2 | Firefox desktop | Firefox latest | Full functionality |
| 3 | Safari desktop | Safari latest | Full functionality |
| 4 | Mobile (iPhone) | Safari iOS | Responsive layout, chat toggle works |
| 5 | Mobile (Android) | Chrome Android | Responsive layout, chat toggle works |
| 6 | Tablet | iPad Safari | Responsive layout |

---

## Environment Requirements

- **Node.js**: 20+
- **Browser**: Chrome/Firefox/Safari (latest)
- **Services**: Neon Postgres, Upstash Redis, LiveKit Cloud
- **OAuth**: Google OAuth credentials configured
- **Env vars**: All in `.env.local` (DATABASE_URL, REDIS, LIVEKIT, NEXTAUTH)

## Running Tests

```bash
# Unit tests (114 tests)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# Production build
npx next build
```
