# Zerocast — Marketing Design System

Scope: `src/app/(marketing)/**` + marketing-facing components (`MarketingNav`,
`Footer`, `FaqSection`, `AnimatedChatWidget`, `BetaModal`, `components/seo/*`).
⊥ webapp surfaces (`studio`, `dashboard`, `join`, `demo`, `settings`,
`session-summary`, `qa`, `status`, `login`, `feedback`, top-level `changelog`).

Tokens defined in `src/app/globals.css` inside `@theme inline {…}`. Tailwind v4
auto-generates utilities (`bg-X`, `text-X`, `border-X`, `from-X`, `to-X`, etc.)
for every `--color-X` registered there. Alpha modifier `/<n>` works on all
tokens (oklch base).

---

## §I — Invariants

V1: ∀ color in marketing scope → use token, ⊥ hex/rgb/oklch literal in JSX.
V2: ∀ palette-direct class (`bg-neutral-*`, `text-indigo-*`, ...) in marketing scope ⊥.
V3: new marketing color need → add token to globals.css `@theme` block first, then consume.
V4: token names semantic (`brand`, `ink-muted`), ⊥ literal (`indigo-500`, `neutral-400`).
V5: webapp UI uses shadcn tokens (`--primary`, `--muted-foreground`, ...) — leave alone.

---

## §T — Token Catalog

### Surfaces (backgrounds)

```
token              | value                 | role
bg-surface         | #080808               | page bg (root marketing layout)
bg-surface-1       | oklch(0.145 0 0)      | card surface primary (≈ neutral-950)
bg-surface-2       | oklch(0.205 0 0)      | card-soft / code block (≈ neutral-900)
bg-surface-3       | oklch(0.269 0 0)      | chip / divider fill (≈ neutral-800)
```

### Ink (text)

```
token              | value                 | role
text-white         | #ffffff               | primary heading & body strong (system primitive, kept)
text-ink-strong    | #ffffff               | alias of text-white, semantic
text-ink-emphasis  | oklch(0.87 0 0)       | emphasis body (≈ neutral-300)
text-ink-muted     | oklch(0.708 0 0)      | default body muted (≈ neutral-400)
text-ink-subtle    | oklch(0.556 0 0)      | secondary metadata (≈ neutral-500)
text-ink-faint     | oklch(0.439 0 0)      | faint label (≈ neutral-600)
text-ink-fainter   | oklch(0.371 0 0)      | tabular nums, decoration (≈ neutral-700)
text-ink-inverse   | oklch(0.145 0 0)      | text on light buttons (≈ neutral-950)
```

### Brand (indigo)

```
token              | value                 | role
brand              | oklch(0.585 0.233 277)| primary accent (indigo-500)
brand-soft         | oklch(0.673 0.182 276)| accent text on dark (indigo-400)
brand-softer       | oklch(0.785 0.115 274)| softer accent text (indigo-300)
brand-on-light     | oklch(0.93 0.034 272) | primary button bg (indigo-100)
```

### Accent (gradient / secondary tags)

```
token                    | value                 | role
accent-purple            | oklch(0.714 0.203 305)| gradient pair end (purple-400)
accent-violet            | oklch(0.606 0.25 292) | violet tag bg (violet-500)
accent-violet-text       | oklch(0.702 0.183 293)| violet tag text (violet-400)
accent-blue              | oklch(0.623 0.214 259)| blue tag bg (blue-500)
accent-blue-text         | oklch(0.707 0.165 254)| blue tag text (blue-400)
accent-pink              | oklch(0.718 0.202 349)| pink tag text (pink-400)
```

### Status

```
token              | value                 | role
success            | oklch(0.723 0.219 149)| solid success (green-500)
success-text       | oklch(0.792 0.209 151)| success text on dark (green-400)
warn               | oklch(0.769 0.188 70) | solid warn (amber-500)
warn-text          | oklch(0.828 0.189 84) | warn text on dark (amber-400)
danger             | oklch(0.637 0.237 25) | solid danger (red-500)
danger-text        | oklch(0.704 0.191 22) | danger text on dark (red-400)
danger-soft        | oklch(0.808 0.114 19) | soft danger text (red-300)
```

### Utility classes (defined in `globals.css @layer utilities`)

```
class              | role
glass-card         | bg-surface-2/40 + border + backdrop blur
text-glow          | text-shadow brand color 50% alpha
brand-glow-hero    | radial gradient bg, brand 12% (homepage hero)
brand-glow-section | radial gradient bg, brand 10% (section hero)
stagger-enter      | fade-up entry animation
marquee-track      | infinite horizontal marquee
```

---

## §U — Usage Patterns

### Primary CTA button (light pill on dark)

```tsx
<Link className="inline-flex items-center gap-2 bg-brand-on-light text-ink-inverse font-bold px-6 py-3 rounded-full hover:opacity-90 transition">
  Request Access <ArrowRight size={16} />
</Link>
```

### Secondary CTA (ghost on dark)

```tsx
<a className="inline-flex items-center gap-2 text-ink-muted hover:text-white text-sm font-medium transition-colors">
  Watch Demo
</a>
```

### Status pill (brand accent)

```tsx
<div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-soft border border-brand/20 rounded-full px-4 py-1.5">
  <span className="w-1.5 h-1.5 rounded-full bg-brand-soft animate-pulse" />
  Private Beta
</div>
```

### Card (dark surface, soft border)

```tsx
<div className="bg-surface-1/40 border border-white/5 rounded-xl p-6">
  <h3 className="text-white font-semibold mb-2">Card title</h3>
  <p className="text-ink-muted text-sm">Body copy goes here.</p>
</div>
```

### Gradient headline text

```tsx
<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-soft to-accent-purple">
  Co-host with AI.
</span>
```

### Hero section glow

```tsx
<section className="relative overflow-hidden">
  <div className="absolute inset-0 -z-10 brand-glow-hero" />
  …
</section>
```

### Status messaging

```tsx
<div className="bg-success/10 border border-success/20 text-success-text">…</div>
<div className="bg-warn/10    border border-warn/20    text-warn-text">…</div>
<div className="bg-danger/10  border border-danger/20  text-danger-soft">…</div>
```

---

## §B — Forbidden Patterns

| pattern                                 | use instead                          |
|-----------------------------------------|--------------------------------------|
| `bg-[#080808]`                          | `bg-surface`                         |
| `bg-[#0a0a0a]`, `bg-[#111]`             | `bg-surface-1`, `bg-surface-2`       |
| `bg-neutral-9XX` / `bg-neutral-8XX`     | `bg-surface-1/2/3`                   |
| `text-neutral-300..700`                 | `text-ink-emphasis..fainter`         |
| `text-neutral-950`                      | `text-ink-inverse`                   |
| `text-indigo-300/400/500`               | `text-brand-softer/soft/brand`       |
| `bg-indigo-100`                         | `bg-brand-on-light`                  |
| `bg-indigo-500/<a>`, `border-indigo-500/<a>` | `bg-brand/<a>`, `border-brand/<a>` |
| `text-purple-400`, `to-purple-400`      | `text-accent-purple`, `to-accent-purple` |
| `text-violet-400`, `bg-violet-500/<a>`  | `text-accent-violet-text`, `bg-accent-violet/<a>` |
| `text-blue-400`                         | `text-accent-blue-text`              |
| `text-red-300/400`, `bg-red-500/<a>`    | `text-danger-soft/text`, `bg-danger/<a>` |
| `text-amber-400`, `bg-amber-500/<a>`    | `text-warn-text`, `bg-warn/<a>`      |
| `text-green-400`, `bg-green-500/<a>`    | `text-success-text`, `bg-success/<a>` |
| `text-gray-400/500`                     | `text-ink-muted/subtle`              |
| `rgba(99,102,241, <a>)` inline          | `color-mix(in oklch, var(--color-brand) <a>%, transparent)` or `brand-glow-*` utility |

`text-white`, `bg-white`, `border-white/<a>`, `bg-black` retained as system primitives (universal, non-themed). Prefer `text-ink-strong` / `text-ink-inverse` when semantic intent matters.

---

## §A — Adding a new token

1. Open `src/app/globals.css`.
2. Add `--color-<name>: <oklch value>;` inside `@theme inline { … }` under the
   appropriate section comment (Surfaces / Ink / Brand / Accent / Status).
3. Use `oklch(L C H)` so alpha modifier `/N` works.
4. Add row to §T in this file.
5. ! Add row to §B if it replaces a banned pattern.

⊥ define raw color inside JSX/CSS files outside `globals.css`. ⊥ extend with
hex/rgb (lose alpha-modifier support).

---

## §V — Verification

```bash
# scan for hardcoded colors in marketing scope
grep -rnE "bg-\[#|text-\[#|border-\[#" src/app/\(marketing\) src/components/{MarketingNav,Footer,FaqSection,AnimatedChatWidget,BetaModal}.tsx src/components/seo
grep -rnoE "(bg|text|border|from|to|via|ring|fill|stroke)-(neutral|zinc|gray|slate|indigo|violet|purple|red|emerald|green|blue|pink|amber)-[0-9]+" src/app/\(marketing\) src/components/{MarketingNav,Footer,FaqSection,AnimatedChatWidget,BetaModal}.tsx src/components/seo
# both should print nothing
```

`npm run lint` & `npm run build:next` ! pass.

---

## §N — Non-color foundations (existing, unchanged)

```
font-sans     | --font-sans (Geist sans)
font-mono     | --font-geist-mono
font-heading  | --font-sans
radius-sm..4xl| derived from --radius: 0.625rem
```

Typography scale uses Tailwind defaults (`text-xs..text-9xl`) + inline
`clamp(min, vw, max)` for fluid display headlines (e.g. hero `clamp(48px, 8vw, 110px)`).
