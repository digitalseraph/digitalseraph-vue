# Changelog

All notable changes to digitalseraph.com are recorded here.

The format is loosely based on [Keep a Changelog](https://keepachangelog.com/).
This is a continuously-deployed static site, not a versioned library, so entries are grouped by date rather than by semver.

## 2026-04-19 — Content + voice

### Added
- Home-page hero tagline `Full-Stack · Cloud · DevOps` (replaces generic `Software · Systems · Shipping`) ([#9](https://github.com/digitalseraph/digitalseraph-vue/pull/9))
- About-page and `resume.yml` content sharpened; Jump lead-engineer bullet added to Cox experience (previously missing); `.NET`, `C#`, `Kubernetes`, `GKE`, `Skaffold`, `HashiCorp Vault`, `SonarQube`, `Vitest`, `Playwright`, `ASP.NET`, `Pinia`, `SQL Server`, `pnpm` added to the skills surface ([#10](https://github.com/digitalseraph/digitalseraph-vue/pull/10))
- Five real work case studies at `/work` — Jump (Cox URL shortener), HIPAA Behavioral Health SaaS (Thrivee), GoFan Docker Environment (Huddle), TRPZ (White Sunrise), Editorial Reservation System (Creative Loafing); each with a matching phosphor-green cover SVG at `public/og/` ([#7](https://github.com/digitalseraph/digitalseraph-vue/pull/7))

### Removed
- Three placeholder work entries (`01-project-one.md`, `02-project-two.md`, `03-project-three.md`) and their placeholder OG covers ([#7](https://github.com/digitalseraph/digitalseraph-vue/pull/7))

### Investigated (no change shipped)
- Bundle-slim — confirmed @nuxt/content 3.13 ships ~400 KB of client-side SQLite WASM with no config-level opt-out. Tried `experimental.payloadExtraction`, `content.ssg`, and `routeRules` — none reduced the bundle. Findings documented at `docs/bundle-slim-investigation.md` ([#8](https://github.com/digitalseraph/digitalseraph-vue/pull/8))

## 2026-04-19 — CI + test coverage (Plan 4)

### Added
- GitHub Actions 4-job workflow at `.github/workflows/ci.yml` (unit + component tests, Playwright E2E, static build, Lighthouse CI) with concurrency cancel on stacked pushes ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- Lighthouse CI config (`lighthouserc.json`) with hybrid enforcement — accessibility 100 strict, performance/best-practices/SEO warn-only — auditing 6 static routes on mobile form factor ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- Component-level test precedent: `tests/component/PostNav.test.ts` covering the three `v-if` branches via `@nuxt/test-utils/runtime`'s `mountSuspended` (+4 tests) ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- Unit test backfill: `useReveal` once-false exit path (+1), `useTyping` stop/reset/done branches (+3), `useCommandKey` new file with 6 cases ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- `package.json` pinned to `pnpm@10.33.0` via `packageManager` field so CI corepack resolves deterministically ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- Actions bumped to `@v5` to silence Node-20-deprecation warnings ([#6](https://github.com/digitalseraph/digitalseraph-vue/pull/6))
- `/resume` added to Lighthouse audit set (passes a11y = 100; perf warn expected for the dynamic terminal) ([#6](https://github.com/digitalseraph/digitalseraph-vue/pull/6))
- 3 MiB bundle-size budget enforced in the `build` job via `::error::` annotation on overshoot ([#6](https://github.com/digitalseraph/digitalseraph-vue/pull/6))

### Fixed
- `<html>` missing `lang` attribute — added `htmlAttrs: { lang: 'en' }` via `app.head` ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- `color-contrast` failures on `/about`, `/writing`, `/contact`, `/writing/[slug]` — loosened `--text-dim` from `#525252` → `#7a7a7a` in dark theme and `#a8a29e` → `#737373` in light theme (both now clear WCAG AA 4.5:1) ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- `heading-order` violation on `/writing` — added optional `headingLevel` prop to `PostCard` + `ProjectCard`; `/work` and `/writing` index pages pass `heading-level="h2"` while landing section usages keep the default `h3` ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- CI `corepack enable` moved before `actions/setup-node` so the pnpm cache lookup succeeds ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- Light-theme `--accent` contrast — green `#22c55e` fails on light canvas; light theme now overrides to `#15803d` (5.2:1) ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))
- E2E flake on slow CI runners — fixed 1200 ms wait replaced with proper `toBeVisible` assertion on intro text ([#5](https://github.com/digitalseraph/digitalseraph-vue/pull/5))

## 2026-04-19 — Writing pipeline polish (Plan 3)

### Added
- Custom phosphor-green Shiki theme at `app/assets/shiki/digitalseraph-dark.json` (accent keywords, amber numbers, pale yellow strings, dim italic comments) wired through `@nuxt/content` for every fenced code block ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- `PostMetaHeader` component — accent `$ writing/` kicker + date + reading-time line above post titles ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- `PostMetaTags` component — tag chips rendered via the existing `TagChip` primitive ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- `PostNav` component — inline previous/next row at the bottom of every post with `v-if`-based empty-end handling ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- `prose.css` — token-aligned `@tailwindcss/typography` overrides; every `--tw-prose-*` variable pulls from the site's design tokens so the light theme works for free ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- Pure helpers: `readingMinutes` (220 wpm, min floor 1) and `getPostSiblings` (reverse-chronological sort) with full TDD coverage ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- Shared `fmtPostDate` helper at `app/utils/postDate.ts` (parses ISO as local date to avoid timezone off-by-one) ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- E2E smoke coverage for the integrated writing post ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))

### Fixed
- `fmtPostDate` parsed ISO strings as UTC midnight; dates shifted back one day in any timezone west of UTC. Now parses as local date from numeric parts ([#3](https://github.com/digitalseraph/digitalseraph-vue/pull/3))
- PostNav arrow glyphs now `aria-hidden="true"` so screen readers read `previous · <title>` rather than `left-arrow previous · <title>` ([#4](https://github.com/digitalseraph/digitalseraph-vue/pull/4))
- Hardcoded `#0a0a0a` on `.prose pre` replaced with a new `--code-bg` token (intentionally not theme-swapped — code-block background stays dark until a matching light Shiki theme ships) ([#4](https://github.com/digitalseraph/digitalseraph-vue/pull/4))
- `content.config.ts` date fields now regex-validated (`^\d{4}-\d{2}-\d{2}$` for post dates, `^\d{4}-\d{2}(-\d{2})?$` for cert issued) so frontmatter typos fail at build time ([#4](https://github.com/digitalseraph/digitalseraph-vue/pull/4))

## 2026-04-18 — Résumé terminal (Plan 2)

### Added
- `/resume` interactive terminal — scripted `$ whoami` intro on first load, sidebar + free-text command input, 10-command set (`whoami`, `cat summary.md`, `cat experience.md`, `ls skills/`, `cat education.md`, `contact`, `help`, `?`, `clear`, `pdf`) ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))
- `ResumePrintView` component with print-only stylesheet; `pdf` command invokes `window.print()` for the browser's Save-as-PDF dialog ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))
- Pure `resumeDispatcher` with discriminated-union `OutputEntry` type ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))
- Six output renderers (`WhoamiBlock`, `ExperienceList`, `SkillsGrid`, `EducationBlock`, `ContactBlock`, `HelpBlock`) ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))
- `resume` data collection in `content.config.ts` with full zod schema ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))
- 7 Playwright E2E scenarios covering intro autoplay, sidebar click, typed input, unknown command, clear, print media, reduced motion ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))

### Changed
- `useResume` made synchronous (returns `Ref<Resume | null>` directly) to avoid async-component flicker when `ResumeEntry` mounts dynamically ([#1](https://github.com/digitalseraph/digitalseraph-vue/pull/1))

### Fixed
- Chore-polish follow-ups from reviews: added `public/favicon.svg` (was 404-ing), extracted `stemToSlug` utility (DRY across 4 consumers), tightened `OutputEntry.name` to a literal union, migrated deprecated `experimental.nativeSqlite` → `sqliteConnector: 'native'`, made `PostCard.excerpt` optional (kills a Vue prop-type warning), `cancelAnimationFrame` on `__resetScrollY`, `NavBar ⌘K` button now toggles (matches keyboard) ([#2](https://github.com/digitalseraph/digitalseraph-vue/pull/2))

## 2026-04-18 — Foundation + landing (Plan 1)

### Added
- Nuxt 4 scaffold at repo root, TypeScript strict, Tailwind v4, Pinia, `@nuxt/content`, `motion-v` ([initial commit](https://github.com/digitalseraph/digitalseraph-vue/commit/f0fda13))
- Design tokens at `app/assets/css/tokens.css` — phosphor-green accent (`#22c55e`), dark-default dual theme, type scale, radii
- Self-hosted Space Grotesk + JetBrains Mono (five `.woff2` weights under `public/fonts/`)
- Pinia stores: `theme` (persisted + `prefers-color-scheme` fallback) and `motion` (reduced-motion detection)
- Motion composables: `useScrollY` (singleton rAF ref), `useParallax`, `useReveal` (IntersectionObserver fade), `useTyping` (typewriter with reduced-motion short-circuit), `useCommandKey` (⌘K global shortcut)
- Layout chrome: `TheNavBar` (hide-on-scroll + theme toggle), `TheCommandPalette` (⌘K overlay with fuzzy route filter + keyboard nav), `TheFooter`, `AppLayout` with skip-to-content link
- Primitive components: `GridBackdrop`, `TerminalPrompt`, `SectionReveal`, `TagChip`, `PillLink`, `CopyInline`, `ProjectCard`, `PostCard`
- Landing page composition: `HeroTerminal`, `AboutTeaser`, `FeaturedWork`, `WritingTeaser`, `ContactCta`
- Routes: `/`, `/about`, `/contact`, `/work`, `/work/[slug]`, `/writing`, `/writing/[slug]`, `/resume`; `[slug]` routes throw `createError({ statusCode: 404 })` on miss
- `@nuxt/content` collection schemas for `about`, `work`, `writing`, `resume` with zod validation
- Vitest unit coverage: theme + motion stores, 4 motion composables (12 tests); Playwright E2E smoke (6 tests)
- Cloudflare Workers + Static Assets deployment via `wrangler.toml`

## Repository bootstrapping

- 2026-04-18 — Repo extracted from the `digitalseraph-meta` monorepo into its own standalone repository, preserving full git history for the Nuxt app via `git subtree split`
- 2026-04-18 — Initial spec + plan committed (`docs/superpowers/specs/2026-04-18-digitalseraph-vue-design.md`, `docs/superpowers/plans/2026-04-18-digitalseraph-vue-foundation.md`)
