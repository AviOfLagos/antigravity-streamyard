# Design Philosophy — "Signal Static"

Marketing visual identity for Zerocast posters, social cards, and embedded
hero graphics. Generated assets live at `src/app/og/marketing/route.tsx` (PNG)
and `public/marketing/*.svg` (vector). Preview kit at `/marketing-kit`.

---

## Manifesto

**Signal Static** is the visual language of a live signal moving from a single
human mouth through fiber, through code, through every chat panel on the
internet — and back again, in your voice, on autopilot. It refuses the
template aesthetic of streaming software. There are no glossy gradients,
no over-rendered 3-D microphones, no AI avatar faces. The work is calm,
broadcast-grade, almost editorial.

The composition is built on **deep negative space**. The page is mostly black
(`#080808`) — the color of an unlit broadcast studio one second before "on
air." Into that quiet field, a single brand-indigo glow rises like a tuning
fork: a soft radial bloom in one corner, never centered. The headline sits
in massive, near-black weight, tracked tight, kerned with painstaking care.
Type does the lifting. Imagery is restraint.

Iconography is **monoline** — thin, even-weight strokes drawing platform
marks, signal pulses, RTMP arrows, broadcast brackets. Never filled. Never
glossy. The illustrations look like they were etched in a single confident
pass with a fine-tip pen by a hand that has done it ten thousand times.
Color is reserved: indigo signal, white type, the occasional ember of red
for "LIVE" or "REC." A faint scanline grid sometimes whispers underneath
everything — the ghost of a CRT — but never loud enough to read as texture.

**Rhythm comes from scale contrast, not from variety.** A status pill is
tiny — eleven-pixel uppercase tracked wide. Beneath it, a headline fills
the canvas. Between them: forty pixels of breath, never thirty, never
fifty. Margin is sacred. Nothing crowds the edge. Every element has been
considered, repositioned, considered again, until the composition reads at
a glance and rewards a second look. Master-level execution is the only
acceptable register.

The aesthetic borrows from late-90s broadcast graphics packages —
Bloomberg, NHK, the BBC News opens of 1998 — filtered through the calm
modernism of Linear's product surfaces and Vercel's monochrome editorial.
It feels like infrastructure that knows it is infrastructure. It does not
beg to be noticed. It is noticed because it is clearly, painstakingly,
the work of someone at the top of their field. Nothing is decorative.
Every pixel earns its place.

The brand voice translates visually to **confident understatement**.
Where competitors shout multi-platform with a confetti of platform logos,
Signal Static lists four icons in a single thin row and lets the silence
between them do the work. Where competitors render the AI co-host as a
glowing humanoid mascot, Signal Static draws a single pulse ring and trusts
the reader. The result must look meticulously crafted, the product of deep
expertise, master-level execution that a senior brand designer at a top
studio would be proud to ship.

---

## Visual System

### Palette (consume from design tokens, never literal)

```
--color-surface         #080808           field/background
--color-brand           oklch(0.585 …)    indigo signal
--color-brand-soft      oklch(0.673 …)    accent text/icon stroke
--color-ink-strong      #ffffff           headline
--color-ink-muted       oklch(0.708 …)    body
--color-ink-faint       oklch(0.439 …)    metadata/labels
--color-danger          oklch(0.637 …)    LIVE/REC dot only
```

⊥ greys outside the ink scale. ⊥ secondary brand accents on social cards
unless the scene is explicitly "AI Co-Host" (brand→accent-purple gradient
allowed for that single headline only).

### Type

- Heading: Geist Sans (loaded via `next/font`), `font-black` (900),
  `tracking-tight` to `tracking-tighter`, `leading-[1]`.
- Status pill / kicker: Geist Sans, uppercase, `font-bold` (700),
  `tracking-widest`, size 10–14px depending on canvas.
- Body: Geist Sans, `leading-relaxed`, weight 400.
- Mono (rare): Geist Mono for technical badges only.

Fluid heading sizes (already used on the marketing site):
- Hero display: `clamp(48px, 8vw, 110px)` — translates to ~120–140px on
  1080-wide social canvases.
- Section H2: `clamp(32px, 4vw, 54px)`.
- Card title: 28–36px.

### Spacing

- Canvas margins: **6.5% of the shorter side**, never less.
- Element gap: **24 / 40 / 80** (no in-between values).
- Status pill to headline: 40px constant.
- Headline to subtext: 24px constant.

### Composition

A poster is built on a **three-zone vertical**:
1. **Kicker zone** (top): status pill / single line label, brand-soft.
2. **Headline zone** (middle): the punch. 1–2 lines, never 3.
3. **Foot zone** (bottom): wordmark + tiny URL/handle on the left, single
   accent graphic on the right.

A square (1:1) collapses zones 2 and 3 onto a shared horizontal axis.
A story (9:16) stretches zone 2 vertically and pushes the foot zone deep.
A banner (3:1) inverts: foot zone left, headline center, kicker right.

### Graphic Vocabulary

Allowed graphic primitives. Combine sparingly.

- **Pulse ring**: 1.5px stroke circle, brand-soft, paired with a 0.5px
  outer ring at 30% opacity. Used as the "AI signal" element.
- **Stream arrows**: thin chevrons in a row of four, monoline.
- **Platform marks**: official YouTube, Twitch, Kick, TikTok glyphs in
  brand-soft, never their native brand colors.
- **Grid whisper**: 1px scanline grid at 4% opacity on `--color-surface-2`.
  Optional.
- **Brand glow**: radial gradient `--color-brand` 12% → transparent,
  positioned upper-right corner at 30% canvas width.

⊥ photographic imagery. ⊥ AI-generated illustration. ⊥ stock streamers
on headsets. ⊥ glossy 3-D microphones.

---

## Scenes (content variants)

The OG route renders any **(variant, scene)** pair. Scenes are the
content moments; variants are the canvas sizes.

| scene id     | kicker             | headline                                | use case                  |
|--------------|--------------------|----------------------------------------|---------------------------|
| `hero`       | Private Beta       | Don't just stream. Co-host with AI.    | Launch announcement       |
| `multistream`| Multistream        | One tab. Four platforms. Zero downloads.| Feature spotlight         |
| `ai-cohost`  | AI Co-Host          | Your voice. Your audience. On autopilot.| AI feature announcement   |
| `browser`    | Browser-Native     | No OBS. No hardware. No drama.         | Anti-OBS positioning      |
| `beta`       | Apply Now          | Private Beta — Now Open.               | Quick CTA card            |
| `quote`      | Built for creators | "Running a live stream is a three-person job you're doing alone." | Thought-leadership / blog |

## Variants (canvas sizes)

| variant id  | dimensions  | platform                              |
|-------------|-------------|--------------------------------------|
| `square`    | 1080 × 1080 | Instagram feed, X post, LinkedIn post |
| `og`        | 1200 × 630  | Open Graph / X card / LinkedIn link   |
| `story`     | 1080 × 1920 | IG / TikTok / Snapchat / YouTube short|
| `banner`    | 1500 × 500  | X header / LinkedIn cover             |
| `portrait`  | 1080 × 1350 | IG portrait post / Pinterest          |

---

## Quality Bar

The work must look meticulously crafted, the product of countless hours by
a designer at the top of their field. Before shipping, check:

- Nothing overlaps. Nothing touches an edge inside the margin zone.
- Every alignment is to the 24/40/80 grid.
- Type kerning has been visually verified, not trusted to the renderer.
- The piece is recognizable as Zerocast at three meters and at three inches.
- Removing any element would weaken the composition. (If not — remove it.)
- A senior brand designer at Linear, Vercel, or Stripe would not flinch.
