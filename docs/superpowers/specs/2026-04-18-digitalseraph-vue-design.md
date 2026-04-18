# digitalseraph.com — design spec

**Date:** 2026-04-18
**Project:** `web/digitalseraph-vue`
**Domain:** digitalseraph.com
**Status:** Design approved, pending implementation plan

---

## 1. Overview

A personal website for David Miller at digitalseraph.com. Long-scroll cinematic landing page with parallax and fade motion, plus routed detail pages for About, Projects, Resume, Writing, and Contact. The resume is an interactive scripted-terminal experience — the site's signature feature.

**Goals**

- Distinctive, artistic, visually beautiful — not generic AI slop or "another dev portfolio"
- Simple to navigate despite the visual ambition (≤2 clicks to anything)
- Fast: fully static output, 60fps motion, respects `prefers-reduced-motion`
- Authorable: posts and projects added by dropping Markdown files; no code changes
- Accessible: WCAG AA, keyboard-first, screen-reader-friendly

**Non-goals (v1)**

- User accounts, comments, analytics dashboards
- CMS admin UI (Markdown in the repo is the CMS)
- i18n / multi-language
- Server-side dynamic features beyond the contact form

---

## 2. Tech stack

| Concern | Choice | Why |
| --- | --- | --- |
| Framework | Nuxt (latest stable, targeting Vue 3 latest, Vite, TypeScript strict) | vuejs.org-recommended meta-framework; SSG + file-based routing + @nuxt/content fit exactly |
| Styling | Tailwind CSS v4 | Iteration speed; tokens declared in a single `@theme` block |
| State | Pinia | Vue's official store |
| Content | @nuxt/content | Markdown/YAML for Writing + Projects + Resume data |
| Motion | `motion.dev` Vue bindings (or `@vueuse/motion` — chosen at implementation based on DX) | Composable, small, works with IntersectionObserver |
| Package manager | pnpm | Nuxt's recommendation |
| Deployment | Cloudflare Pages (static, `nuxt generate`) | Free, fast, first-class Nuxt support |
| Contact form | Formspree (v1) | No server required; swappable to Cloudflare Worker in v2 |
| Testing | Vitest, `@nuxt/test-utils`, Playwright | Unit, component, and E2E coverage |
| Linting | ESLint (`@nuxt/eslint`), Prettier | Standard Nuxt 3 toolchain |

---

## 3. Aesthetic identity

- **Direction:** Neo-tech / terminal, executed with restraint
- **Accent:** Phosphor Green `#22c55e` (same in both themes — the anchor)
- **Themes:** Dark (default) and Light; `prefers-color-scheme` respected on first visit, choice persisted in `localStorage`
- **Typography:** Space Grotesk (display + body) + JetBrains Mono (prompts, labels, code)
- **Tone:** Honest, technical, memorable without being precious

### 3.1 Color tokens

```
--canvas        : dark #0a0a0a  | light #fafaf9
--canvas-raised : dark #111114  | light #f5f5f4
--line          : dark rgba(255,255,255,0.08) | light rgba(10,10,10,0.1)
--text          : dark #fafafa  | light #1c1917
--text-muted    : dark #a3a3a3  | light #57534e
--text-dim      : dark #525252  | light #a8a29e
--accent        : #22c55e
--accent-glow   : rgba(34,197,94,0.35)
--grid-line     : dark rgba(255,255,255,0.04) | light rgba(10,10,10,0.04)
```

### 3.2 Type scale

```
display-xl  72 / 0.95 / -0.04em    (hero name)
display-l   48 / 1.0  / -0.03em    (section titles)
display-m   32 / 1.05 / -0.02em    (card titles)
body-l      18 / 1.6               (lead paragraphs)
body        16 / 1.6               (body text)
mono-l      16 / 1.5  / 0.02em     (prompts, terminal lines)
mono        13 / 1.55 / 0.02em     (code, labels)
label       11 / 1.4  / 0.18em uc  (overlines, tags, footer)
```

### 3.3 Spacing, grid, radii, shadows

- **Spacing:** 4-based scale (4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192)
- **Grid:** 12-col ≥1024px · 6-col 640–1023px · 4-col <640px. Container max 1280px, gutters 32px
- **Radii:** 2px (chips) · 6px (cards) · 10px (modals)
- **Shadows:** `0 0 0 1px var(--line)` for separation; one real drop shadow reserved for the command palette overlay

All tokens exposed as CSS custom properties and mirrored into a Tailwind v4 `@theme` block.

---

## 4. Architecture

### 4.1 File layout (Nuxt file-based routing)

```
web/digitalseraph-vue/
├── app.vue
├── nuxt.config.ts
├── tailwind.config.ts                 # v4 theme extensions only
├── assets/
│   ├── css/
│   │   ├── tokens.css                 # @theme block, color + type tokens
│   │   └── prose.css                  # long-form article styles
│   └── fonts/                         # self-hosted Space Grotesk + JetBrains Mono
├── components/
│   ├── layout/
│   │   ├── AppLayout.vue
│   │   ├── TheNavBar.vue
│   │   ├── TheFooter.vue
│   │   └── TheCommandPalette.vue
│   ├── landing/
│   │   ├── HeroTerminal.vue
│   │   ├── AboutTeaser.vue
│   │   ├── FeaturedWork.vue
│   │   ├── WritingTeaser.vue
│   │   └── ContactCta.vue
│   ├── primitives/
│   │   ├── TerminalPrompt.vue
│   │   ├── GridBackdrop.vue
│   │   ├── SectionReveal.vue
│   │   ├── TagChip.vue
│   │   ├── PillLink.vue
│   │   ├── ProjectCard.vue
│   │   ├── PostCard.vue
│   │   └── CopyInline.vue
│   ├── resume/
│   │   ├── ResumeTerminal.vue
│   │   ├── ResumeCommandList.vue
│   │   ├── ResumeExperienceEntry.vue
│   │   ├── ResumeSkillsGrid.vue
│   │   └── ResumePdfExport.vue
│   └── writing/
│       ├── ProseContainer.vue
│       ├── CodeBlock.vue
│       └── PostMeta.vue
├── composables/
│   ├── useParallax.ts
│   ├── useReveal.ts
│   ├── useTyping.ts
│   ├── useScrollY.ts                  # singleton rAF scroll store
│   └── useKeyboard.ts                 # ⌘K and global shortcuts
├── stores/
│   ├── theme.ts
│   └── motion.ts
├── content/
│   ├── about.md
│   ├── resume.yml
│   ├── work/*.md
│   └── writing/*.md
├── pages/
│   ├── index.vue
│   ├── about.vue
│   ├── work/index.vue
│   ├── work/[slug].vue
│   ├── resume.vue
│   ├── writing/index.vue
│   ├── writing/[slug].vue
│   └── contact.vue
├── public/
│   ├── favicon.svg
│   └── og/                            # social card images per route
├── tests/
│   ├── unit/                          # vitest
│   ├── component/                     # @nuxt/test-utils
│   └── e2e/                           # playwright
├── wrangler.toml
├── package.json
├── tsconfig.json
├── CLAUDE.md
└── README.md
```

### 4.2 Routes

| Route | Purpose |
| --- | --- |
| `/` | Long-scroll landing: Hero → About teaser → Featured work → Writing teaser → Contact CTA |
| `/about` | Full About (photo, longer story, principles) |
| `/work` | All projects grid/list |
| `/work/[slug]` | Project case study |
| `/resume` | Interactive terminal resume + PDF export |
| `/writing` | Post index |
| `/writing/[slug]` | Post detail |
| `/contact` | Form + direct links (email, socials, GitHub) |

### 4.3 Navigation

- **Top bar:** fixed, thin, prompt-styled (`~/digitalseraph.com ❯ home · about · work · resume · writing · contact`). Hides on scroll down, returns on scroll up. Theme toggle on the right. ⌘K hint.
- **Command palette (⌘K):** full-screen overlay, fuzzy search across routes, project slugs, post titles, resume sections. Keyboard-first; arrow keys + enter; esc to close.
- Keyboard-reachable everywhere. Focus ring uses the accent color.

---

## 5. Motion system

### 5.1 Composables

- `useParallax(ref, { speed })` — binds `translateY` to scroll position (GPU transform only). Speeds: `0.1` deep · `0.25` mid · `0.5` foreground · `1.2` "closer-than-normal" for depth inversion.
- `useReveal(ref, { stagger })` — fade + short Y-lift on viewport enter. Stagger applies to direct children.
- `useTyping(text, { speed, startOn })` — typewriter; pauses off-screen; renders final text instantly under reduced motion.
- `useScrollY()` — singleton rAF store so only one scroll listener exists globally.

### 5.2 Timing

- **Easing:** enter `cubic-bezier(0.2, 0.6, 0.2, 1)`; exit `cubic-bezier(0.4, 0, 0.6, 1)`
- **Durations:** 120ms micro · 240ms UI · 520ms reveal · 1200ms hero typing
- **Route transitions:** 200ms cross-fade (Nuxt page transition)

### 5.3 Hero composition

- Layer 0 — grid background — parallax 0.1×
- Layer 1 — radial green glow — parallax 0.25×
- Layer 2 — `$ whoami` + name — normal
- Layer 3 — cursor + corner ornaments — parallax 1.2× (depth inversion)

### 5.4 Reduced motion

`prefers-reduced-motion: reduce` collapses all parallax to `transform: none`, fade reduced to 80ms, typing effect renders text instantly. Non-negotiable.

---

## 6. Content strategy

**v1 ships with realistic placeholder content** shaped like David's actual work (representative projects, resume entries, short essays). Replace by editing the Markdown/YAML files before launch; no code changes required. Alternative: David hands bullet points during implementation and we weave them in.

### 6.1 Schemas

**`content/work/*.md` frontmatter**
```yaml
title: string
year: number
role: string
stack: string[]
links:
  live?: string
  repo?: string
  writeup?: string
cover: string          # path under public/
featured: boolean      # surfaces on homepage
summary: string        # one-line
```
Body is long-form Markdown.

**`content/writing/*.md` frontmatter**
```yaml
title: string
date: YYYY-MM-DD
tags: string[]
excerpt: string
draft: boolean         # hidden in production when true
```
Body is long-form Markdown.

**`content/resume.yml`**
```yaml
header:
  name: string
  role: string
  location: string
  email: string
experience:
  - role: string
    company: string
    start: YYYY-MM
    end: YYYY-MM | "present"
    domains: [leadership, frontend, systems, ml, ...]
    bullets: [string, ...]
education: [...]
skills:
  - group: "Languages"
    items: [TypeScript, Rust, ...]
  - group: "Platforms"
    items: [...]
principles: [string, ...]  # short tenets
contact:
  email: string
  github: string
  linkedin: string
  x: string
```

The Resume terminal renders this data when corresponding commands fire (`cat experience.md`, `ls skills/`, `cat principles.md`, `cat education.md`, `contact`). PDF export reuses the same data through a print stylesheet.

---

## 7. Build, deploy, and CI

- `pnpm install` → `pnpm dev` for local; `pnpm generate` for static build
- GitHub repo → Cloudflare Pages project; push to `main` deploys production, branch pushes get preview URLs
- `wrangler.toml` committed so `wrangler pages deploy` works from CLI
- Lighthouse budget enforced in CI: Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95
- Playwright smoke tests run against the preview URL on each PR

---

## 8. Testing

- **Unit (Vitest):** composables (`useParallax`, `useTyping`, `useReveal`), content parsers, ResumeTerminal command dispatch
- **Component (`@nuxt/test-utils`):** ResumeTerminal renders correct sections per command, CommandPalette filters correctly, theme toggle persists
- **E2E (Playwright) — golden paths:**
  - Homepage loads, nav works, all scroll sections render
  - Resume terminal auto-types and expand/collapse works
  - ⌘K opens, filters, routes
  - Theme toggle persists across navigation + reload
  - PDF print stylesheet renders correctly (screenshot comparison)
  - Reduced-motion mode disables parallax + typing
  - Mobile layout at 390px passes
- **Manual verification before merge:** hero parallax on a mid-tier laptop; reduced-motion toggle in OS; mobile at 390px.

---

## 9. Accessibility

- WCAG AA contrast minimum across both themes
- All interactive elements keyboard-reachable with visible focus (`:focus-visible` ring in accent color)
- Semantic HTML: `<nav>`, `<main>`, `<article>`, `<time>`; skip-to-content link
- Resume terminal announces section changes to screen readers via `aria-live="polite"`
- Command palette is a proper `role="dialog"` with focus trap and `Escape` to close
- Images have `alt` text; decorative ornaments use `aria-hidden`
- `prefers-reduced-motion` honored globally

---

## 10. Open questions (to resolve during implementation)

1. Motion library: `motion.dev` Vue bindings vs `@vueuse/motion` — pick whichever has cleaner SSG ergonomics at scaffold time.
2. Syntax highlight theme for code blocks in Writing: derive from phosphor-green palette (custom Shiki theme) or use an off-the-shelf dark/light pair. Default to custom; fall back if timeboxed.
3. Long-form prose font in Writing: stick with Space Grotesk or introduce a system serif for reading. Decide when we have real post content in front of us.
4. Real content: David will either hand over bullet points during implementation or replace placeholders before launch. No blocker either way.

---

## 11. Out of scope for v1 (future work)

- RSS / Atom feed for Writing (small; can add once posts exist)
- Analytics (privacy-respecting option like Plausible, behind a toggle)
- Newsletter signup
- Search (@nuxt/content has built-in full-text; wire up if desired in v1.1)
- Project comments / reactions
- Dark↔light animated theme transition (v1 is an instant swap)
