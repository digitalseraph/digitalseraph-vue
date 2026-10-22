# Session log

Narrative of design decisions and their rationale, complementing the [CHANGELOG](../CHANGELOG.md) (what shipped) with the *why*.

This captures the moments where the project could have gone a different way — aesthetic picks, architectural trade-offs, rejected alternatives, lessons learned from things that didn't work. When in doubt about *why* a piece of the site looks or works a certain way, this is where to check first.

---

## Aesthetic direction: Neo-tech + terminal (over celestial, editorial, brutalist)

During the original brainstorm, four aesthetic directions were on the table:

1. **Celestial / cosmic** — leans into the "seraph" name; dark indigo, drifting stars, serif display
2. **Editorial / magazine** — Kinfolk/Cereal, cream paper, asymmetric grids, layered imagery
3. **Neo-tech / terminal** — near-black canvas, subtle grid, one sharp accent, mono + sans mix
4. *(Implicit fourth: generic minimalism — never on the table)*

**Picked:** (3) Neo-tech. Rationale: the visual vocabulary of the terminal (prompt, chevron, mono type, grid backdrop) reads as *specific to this engineer* in a way the celestial or editorial directions don't. The terminal aesthetic is a known idiom among the target audience (hiring managers, fellow engineers) and rewards exactly the kind of visitor the site exists to attract.

From there, the palette choice narrowed to **phosphor green `#22c55e`** (classic hacker terminal, but restrained) over cyan, amber-CRT, or coral. Green was chosen for recognizability + brand-anchor durability across dark + light themes.

---

## Resume as interactive terminal (over timeline, command palette matrix)

The résumé page design specifically considered three treatments:

1. **Terminal session** — scripted commands reveal sections (`cat experience.md`, `ls skills/`)
2. **Filterable timeline** — vertical timeline of roles with tag-filter chips
3. **Command palette + matrix** — ⌘K-driven filter over roles/skills/years

**Picked:** (1) Terminal session. Rationale: it's the one that rewards curiosity in a way the others don't — the user types a command, something happens. The palette variant was more "developer-tool" than "résumé." The timeline variant was the safest but least differentiated.

Within Terminal session, the first-load behavior picked was the **hybrid** — auto-type a single `$ whoami` intro (~1s), then sit quiet. Full-autoplay would have forced a 15s cutscene on every visit (bad for repeat viewers). Click-only would have deprived first-time visitors of the "oh wow" moment.

---

## `useResume()` synchronous (over `async`)

First draft was `async function useResume()` — callers awaited the composable and then read `resume.value`. This made every output component (`WhoamiBlock`, `ExperienceList`, etc.) an *async component* via top-level `await`, which requires a `<Suspense>` boundary.

**Problem:** `ResumeTerminal` dynamically appends `ResumeEntry` children to a buffer whenever the user runs a command. Each newly-mounted `ResumeEntry` → async child → re-suspends its ancestor. Reviewers flagged this as a source of flicker in practice.

**Fix:** made `useResume()` synchronous. It returns `Ref<Resume | null>` directly. `useAsyncData("resume", ...)` is key-deduped so all six call sites share one fetch; the ref is populated before first render via Nuxt's SSR prefetch. No Suspense needed, no async components, no flicker. All 6 output components + the print view + the orchestrator simplified.

Lesson: **composables that return `Ref<T | null>` are often better than ones that `await`.** The `null` transient is cheap to guard with `v-if`/`??`; the async semantics are expensive to reason about.

---

## Custom Shiki theme (over off-the-shelf)

For code blocks in blog posts, the choice was:

1. **Custom phosphor-green theme** — built from scratch, matches the site's accent
2. **Vitesse Dark** (Anthony Fu's popular theme) — muted, readable
3. **Rosé Pine Moon** — warm purples, more color variety

**Picked:** (1) Custom. The accent color has to thread through the site; off-the-shelf themes introduced their own identity that competed with the site's green. Built as a VS Code-format JSON theme committed at `app/assets/shiki/digitalseraph-dark.json`.

**Gotcha that cost an hour:** `@nuxt/content` 3.13 does `Object.entries(options.theme)` on the theme config, so a bare theme object gets its keys iterated as if they're named theme variants. Workaround: pass as `theme: { default: digitalseraphDark }` (wrapped). Plus `JSON.parse(JSON.stringify(...))` to deep-clone and avoid a circular-ref crash in `klona` during config serialization. Both documented inline in `nuxt.config.ts`.

---

## Hybrid Lighthouse enforcement (a11y strict, perf/BP/SEO warn)

CI setup considered three enforcement shapes:

1. **All-strict** — any budget miss fails the build
2. **All-warn** — CI reports scores but never fails
3. **Hybrid** — a11y is non-negotiable (error), others warn

**Picked:** (3) Hybrid. Rationale: a11y regressions are always worth blocking — they indicate a real defect, not a content-weight trade-off. Performance scores drift with new images/content in ways that aren't necessarily regressions worth blocking PRs over. Same for BP/SEO.

**The gate paid for itself immediately:** first-ever LHCI run found three real a11y bugs — `<html>` missing `lang`, four pages with contrast failures on `--text-dim`, one heading-order violation on `/writing`. All three were quick fixes. Without the gate, they would have shipped to prod.

---

## Kept `@nuxt/content` despite the 2 MiB SQLite bloat

During Plan 4's polish, a `du -sb .output/public` audit flagged that the built site is ~2.65 MiB, with ~2.3 MiB being `@nuxt/content`'s client-side SQLite WASM runtime (for SPA-navigation queries). The site is pure static (`nitro.preset: "static"`) — all `queryCollection()` calls resolve at build time, so the client runtime is dead weight.

**Investigated three config-level escape hatches** (`experimental.payloadExtraction`, speculative `content.ssg`, `routeRules`). All ineffective — `@nuxt/content/dist/runtime/client.js` is statically imported by every `queryCollection` call, its WASM chunks are reachable in the Vite import graph, and the module explicitly excludes `@sqlite.org/sqlite-wasm` from `vite.optimizeDeps`. See `docs/bundle-slim-investigation.md`.

**Decision:** accept the 2.65 MiB for now. On the wire it's ~600 KB gzipped; per-route code splitting means no single page loads all of it; real users don't feel the difference. The CI bundle budget is 3 MiB — enough headroom but catches runaway growth.

**Future paths** (all require code, not config):
- Replace `queryCollection` with a hand-rolled Markdown loader reading prerendered payloads (~1.8 MiB savings, ~2-3 hr of work)
- File upstream issue on @nuxt/content for a `client.runtime: 'fetch' | 'wasm'` opt-out

---

## Subagent-driven development with per-task review

Every plan (1–4) was executed by a controller loop dispatching a fresh subagent per task, with two-stage review (spec compliance, then code quality) between each task. This lets each subagent start with zero session context — fresh attention on the specific task — while the controller preserves its own context for coordination.

**Worked well** — TDD was followed more consistently than manual execution typically produces, fresh context prevented confusion across tasks, and the review loop caught real issues early (PillLink internal-navigation bug, CommandPalette NaN on empty filter, useResume's `globalThis` cast that wouldn't work at runtime, async-component flicker).

**When it cost too much** — Plan 1's 31 tasks × 3 dispatches = ~93 subagent invocations. That's thorough but slow. Switched to a **batched protocol** mid-Plan-1: group related tasks (all primitive components, all output components, etc.) into single implementer calls with a combined review at the batch boundary. Trade-off: coarser review granularity for ~60% less wall-clock. For Plans 2–4, used the batched protocol by default, reserving per-task for genuinely novel integration points.

---

## Worktree pattern for feature branches (over in-place checkout)

Each plan executed on its own feature branch inside a dedicated `git worktree` at `E:/dev/repos/digitalseraph-vue-<plan-name>/`. The main checkout at `E:/dev/repos/digitalseraph-vue/` stayed on `master` for spot-checks, PR review, and quick fixes.

Worked well in the early plans. Later plans (3, 4) dropped back to plain feature-branch-in-place because the worktree mental overhead (two directories, remembering which one holds which branch) outweighed the isolation benefit for small, fast-iterating plans.

**Rule I'd apply next time:** worktrees for multi-day plans with many subagent dispatches. Plain branches for single-session mini-plans.

---

## Cloudflare Workers + Static Assets (over Pages)

Original plan specified Cloudflare Pages. The dashboard setup wizard actually created a **Workers** project instead (Cloudflare has been steering new projects toward Workers + Static Assets). First build failed because `wrangler.toml` had `pages_build_output_dir = "dist"` which `wrangler deploy` (Workers) doesn't understand.

**Adapted to Workers:**
- Replaced `pages_build_output_dir` with `[assets] directory = "./.output/public"`
- Changed Nitro preset from `cloudflare-pages` to `static` (forced explicitly — CF auto-detection otherwise emitted `.output/server/wrangler.json` that redirected to a non-existent Worker script)
- Build command stays `pnpm install && pnpm generate`

Works cleanly and is aligned with Cloudflare's direction.

---

## Incidents worth remembering

**2026-04-18 — CommandPalette NaN on empty filter.** ArrowDown/Up on an empty filter result computed `(selected + 1) % 0 = NaN`. Fixed with an early-return; also added a `watch(filtered, ...)` to clamp `selected` when the filter narrows. Caught by a reviewer subagent, not by any existing test.

**2026-04-18 — useResume `globalThis` cast.** The original fallback form used `(globalThis as any).queryCollection(...)` which worked under vitest's `stubGlobal` but crashed at Nuxt runtime. Caught before production by a reviewer insisting on a probe page in `pnpm dev`. Switched to `useAsyncData` + `mockNuxtImport` for the test.

**2026-04-18 — `@nuxt/content` `nativeSqlite` quirk.** Plain `content.experimental.nativeSqlite: true` failed because @nuxt/content 3.13 iterates theme keys via `Object.entries`. Fix: wrap as `{ default: theme }`. Documented inline in `nuxt.config.ts`.

**2026-04-19 — Three real a11y bugs caught by the first-ever LHCI run.** Missing `<html lang>`, `--text-dim` contrast failures across four pages, heading-order violation on `/writing`. All three landed as same-PR fixes.

**2026-04-19 — fmtPostDate timezone shift.** `new Date("2026-03-12")` parsed as UTC midnight; formatted dates shifted back one day in US timezones. Fixed by parsing ISO parts manually as local date.

**2026-04-19 — E2E flake on slow CI runners.** The résumé smoke test's fixed `waitForTimeout(1200)` raced with the intro-typing loop on GitHub's ubuntu runners. Replaced with a proper `toBeVisible` assertion on the typed text.

**2026-04-19 — Light-theme accent contrast.** Phosphor green `#22c55e` on light canvas `#fafaf9` = 2.18:1 ratio, fails WCAG AA. Light theme now overrides `--accent` to `#15803d` (5.2:1). Only caught by running Lighthouse — visual review didn't see it.

---

## Open threads (worth picking up later)

- **Blog posts** — still two placeholder posts, never written
- **Bundle slim via hand-rolled content loader** — ~1.8 MiB savings available, non-trivial migration
- **Cross-browser E2E** — Chromium-only today