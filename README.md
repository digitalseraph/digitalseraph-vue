# digitalseraph-vue

Personal site for David Miller — [digitalseraph.com](https://digitalseraph.com).

A neo-tech terminal aesthetic over a prerendered Nuxt 4 SPA: custom phosphor-green Shiki syntax theme, self-hosted type, token-driven dual-theme support, an interactive résumé terminal, a writing pipeline with staggered reveal and prev/next navigation, and a full CI pipeline gating accessibility strictly.

## Stack

- **Framework** — Nuxt 4 + Vue 3, TypeScript strict
- **Styling** — Tailwind CSS v4, `@tailwindcss/typography`, custom design tokens in CSS variables
- **State** — Pinia (`theme` store with persistence; `motion` store with `prefers-reduced-motion`)
- **Content** — `@nuxt/content` v3 with `data` + `page` collections, zod-validated schemas
- **Syntax highlighting** — custom phosphor-green Shiki theme
- **Motion** — `motion-v`, hand-rolled composables (`useScrollY`, `useParallax`, `useReveal`, `useTyping`)
- **Testing** — Vitest (unit + component via `mountSuspended`), Playwright (E2E)
- **Deploy** — Cloudflare Workers + Static Assets via `wrangler.toml`
- **CI** — GitHub Actions (unit, E2E, static build, Lighthouse CI with a11y = 100 strict)

## Develop

```bash
pnpm install
pnpm dev
```

Opens at http://localhost:3000.

## Build

```bash
pnpm generate   # static output in .output/public
```

## Tests

```bash
pnpm test:unit   # vitest: 49 unit + 4 component tests
pnpm test:e2e    # playwright: 14 E2E scenarios across smoke + résumé terminal
```

## Deploy (Cloudflare Workers + Static Assets)

The production site deploys from `master` via the Cloudflare Workers integration.
To deploy from CLI:

```bash
pnpm generate
pnpm dlx wrangler deploy
```

`wrangler.toml` declares `[assets] directory = "./.output/public"` so a static worker is provisioned that serves the prerendered site directly — no Worker script required.

### One-time Cloudflare setup (manual)

In the Cloudflare dashboard:

1. Workers → Create application → Connect to Git → pick the `digitalseraph-vue` repo
2. Build command: `pnpm install && pnpm generate`
3. Deploy command: `pnpm dlx wrangler deploy` (or leave blank to use `wrangler.toml`)
4. Root directory: repo root (no sub-path)

Then in Custom Domains, add `digitalseraph.com` and `www.digitalseraph.com`.

## Continuous integration

`.github/workflows/ci.yml` runs on every PR and push to `master`:

| Job | Runs | Blocks on |
| --- | --- | --- |
| `unit` | `pnpm test:unit` (53 tests) | Any failure |
| `e2e` | Playwright chromium smoke (14 tests) | Any failure |
| `build` | `pnpm generate` + 3 MiB bundle-size budget | Any failure or overshoot |
| `lighthouse` | LHCI on 6 audited routes, mobile form factor | Accessibility < 100 on any route |

Performance, Best Practices, and SEO audit below their thresholds as warnings but don't block.

## Content layout

- `content/about.md` — About page copy
- `content/resume.yml` — Résumé data powering both the interactive terminal and the print view
- `content/work/*.md` — Project case studies (5 real entries as of this writing)
- `content/writing/*.md` — Blog posts (`draft: true` hides from the listing)

Frontmatter schemas are zod-validated in `content.config.ts` — typos fail the build.

## Project structure

```
app/
├── assets/
│   ├── css/             tokens.css + main.css + prose.css (overrides @tailwindcss/typography)
│   └── shiki/           custom phosphor-green JSON theme
├── components/
│   ├── layout/          NavBar, Footer, AppLayout, CommandPalette
│   ├── landing/         HeroTerminal + 4 section teasers
│   ├── primitives/      GridBackdrop, TerminalPrompt, SectionReveal, ProjectCard, PostCard, CopyInline, PillLink, TagChip
│   ├── resume/          Terminal + Sidebar + Buffer + Prompt + PrintView + 6 output renderers
│   └── writing/         PostMetaHeader, PostMetaTags, PostNav
├── composables/         useScrollY, useParallax, useReveal, useTyping, useKeyboard, useResume
├── pages/               file-based routing: /, /about, /contact, /work, /work/[slug], /writing, /writing/[slug], /resume
├── stores/              theme (persisted), motion (reduced-motion detection)
├── types/               Resume, PostRef
└── utils/               resumeDispatcher, resumeDate, postNav, readingTime, postDate, slug
```

## Documentation

- [`CHANGELOG.md`](./CHANGELOG.md) — dated log of everything that's shipped
- [`docs/session-log.md`](./docs/session-log.md) — narrative of design decisions + the *why* behind key choices
- [`docs/superpowers/specs/`](./docs/superpowers/specs/) — design specs (4 plans so far)
- [`docs/superpowers/plans/`](./docs/superpowers/plans/) — implementation plans
- [`docs/bundle-slim-investigation.md`](./docs/bundle-slim-investigation.md) — the `@nuxt/content` SQLite-bundle dead-end
