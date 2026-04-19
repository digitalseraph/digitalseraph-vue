# CI and test-coverage hardening — design spec

**Date:** 2026-04-19
**Project:** `digitalseraph-vue`
**Status:** Design approved, pending implementation plan
**Supersedes:** the original Plan 1 design's Testing section CI note ("Lighthouse budget check in CI: Performance ≥ 90, Accessibility = 100, Best Practices ≥ 95, SEO ≥ 95"). This spec defines how those budgets are enforced.

---

## 1. Overview

Wire a GitHub Actions CI pipeline that runs on every push to `master` and every PR targeting `master`. Enforce the site's test and performance posture: run unit + component tests, run Playwright E2E, produce a successful static build, and audit the build with Lighthouse CI (LHCI). Accessibility regressions fail the build; performance / best-practices / SEO drops warn but don't block. Backfill test coverage for branches previously flagged uncovered: `useReveal` with `once: false`, `useTyping` `stop()`/`reset()`/`done`, the entire `useCommandKey` composable (no prior tests). Establish the first component-level test as a precedent for future presentation-component coverage via `@nuxt/test-utils`' `mountSuspended`.

**Goals**

- Every PR runs the full test + build + audit matrix; a green CI means the change is safe to merge
- Accessibility score of 100 on every audited page, every PR — non-negotiable
- Visible, linked LHCI reports on PR runs so score drift is easy to spot without merging
- Expand unit + component coverage to cover the branches prior reviews flagged
- Set a repeatable pattern for future component tests (Vitest + `mountSuspended`)

**Non-goals (v1)**

- Visual regression baselines (Playwright screenshots) — too fragile across CI machines without a pixel-diff tolerance pass; defer until it's demonstrably needed
- Coverage threshold enforcement (`≥ 80% statement coverage`) — leads to metric-gaming; prefer strategic tests
- CI audit of `/resume` — its client-side hydration + auto-type intro produces noisy Lighthouse scores that don't reflect real reader experience; revisit once post-Plan-2 behavior is stable under audit
- Deploy pipeline inside CI — Cloudflare handles deploy via its GitHub integration; CI doesn't push artifacts
- Matrix across multiple Node versions — the project uses the version pinned in `.nvmrc`; a matrix adds cost without real signal

---

## 2. GitHub Actions workflow

### 2.1 File

`.github/workflows/ci.yml`

### 2.2 Triggers

- `push` to `master` (post-merge sanity check)
- `pull_request` targeting `master` (primary gate)

### 2.3 Jobs

Four jobs, all on `ubuntu-latest`. Node version from `.nvmrc`. pnpm version via corepack (reads `packageManager` field from `package.json` if present; otherwise `pnpm@10.33.0`). pnpm store caching through `actions/setup-node@v4`'s built-in pnpm cache.

**Job: `unit`** (fastest — ~30s)
```yaml
- checkout
- setup-node (with pnpm cache)
- corepack enable
- pnpm install --frozen-lockfile
- pnpm test:unit
```

**Job: `e2e`** (~3 min)
```yaml
- checkout
- setup-node (with pnpm cache)
- corepack enable
- pnpm install --frozen-lockfile
- pnpm dlx playwright install --with-deps chromium
- pnpm test:e2e
```

Playwright's `webServer` config starts `pnpm dev` automatically. On CI the `reuseExistingServer: !process.env.CI` flag means it always spins up a fresh server.

**Job: `build`** (~1 min)
```yaml
- checkout
- setup-node (with pnpm cache)
- corepack enable
- pnpm install --frozen-lockfile
- pnpm generate
- upload-artifact: .output/public (for lighthouse job to download)
```

**Job: `lighthouse`** (needs `build`; ~2 min)
```yaml
- checkout
- setup-node (with pnpm cache)
- corepack enable
- pnpm install --frozen-lockfile
- download-artifact: .output/public
- npx -y @lhci/cli@latest autorun
```

### 2.4 Job parallelism

`unit`, `e2e`, `build` run in parallel. `lighthouse` depends on `build`'s artifact. Wall-clock CI time: ~4–5 min (dominated by `e2e` and `lighthouse` in parallel after build).

### 2.5 Concurrency

Cancel in-progress runs on the same ref when a new commit arrives:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

Stops CI burn when pushes stack up on a branch.

### 2.6 Failure gating

Default GitHub Actions behavior: if any job's final step exits non-zero, the job fails; if any job fails, the workflow fails. No `continue-on-error` overrides. The Lighthouse hybrid enforcement (a11y = 100 strict, others warn) is implemented inside `lighthouserc.json`'s `assert` block — LHCI itself exits 0 for warnings and non-zero for errors.

---

## 3. Lighthouse CI configuration

### 3.1 File

`lighthouserc.json` at repo root.

### 3.2 Contents

```jsonc
{
  "ci": {
    "collect": {
      "staticDistDir": ".output/public",
      "url": [
        "http://localhost/",
        "http://localhost/about",
        "http://localhost/writing",
        "http://localhost/contact",
        "http://localhost/writing/2026-03-12-first-post"
      ],
      "settings": {
        "emulatedFormFactor": "mobile",
        "throttlingMethod": "simulate",
        "onlyCategories": ["performance", "accessibility", "best-practices", "seo"]
      },
      "numberOfRuns": 1
    },
    "assert": {
      "assertions": {
        "categories:accessibility":  ["error", { "minScore": 1.0 }],
        "categories:performance":    ["warn",  { "minScore": 0.90 }],
        "categories:best-practices": ["warn",  { "minScore": 0.95 }],
        "categories:seo":            ["warn",  { "minScore": 0.95 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### 3.3 Configuration choices

- **`staticDistDir`** — LHCI spawns its own static server against the Nuxt static build. No separate `serve` step needed.
- **Form factor: mobile** — stricter than desktop; passing mobile implies passing desktop.
- **`numberOfRuns: 1`** — one sample per URL; cheap signal. Bumping to 3 averages out variance when we care.
- **`upload.target: temporary-public-storage`** — LHCI posts a report URL to the CI log for every run. Reports live ~7 days. Free, no server to host.

### 3.4 Audited URLs

5 URLs covering the static surfaces:
1. `/` (landing — the most visited surface)
2. `/about` (simple prose — baseline signal)
3. `/writing` (post index — Tailwind Typography + card list)
4. `/contact` (minimal page — pure-text baseline)
5. `/writing/2026-03-12-first-post` (post detail — exercises prose + Shiki + PostMeta + PostNav)

**Explicitly skipped:** `/resume` (client-side hydration noise), `/work` and `/work/[slug]` (case studies are placeholder content; add after real content lands).

### 3.5 Enforcement shape

- **Accessibility = 100** (`error`) — any audit failing = CI failure. a11y regressions block PRs.
- **Performance ≥ 90** (`warn`) — reported in the run log; does not fail CI.
- **Best Practices ≥ 95** (`warn`) — same.
- **SEO ≥ 95** (`warn`) — same.

Warnings still surface in the report; drift is visible, but PRs proceed. When a site-wide perf regression happens (e.g. large image added), maintainers see the warning and decide whether to address. No metric gaming, no forced-block-on-content-weight-growth.

---

## 4. Component test for `PostNav`

### 4.1 File

`tests/component/PostNav.test.ts` (new directory)

### 4.2 Vitest config update

`vitest.config.ts` `include` glob expands to pick up the new directory:

```ts
test: {
  environment: "happy-dom",
  include: [
    "tests/unit/**/*.test.ts",
    "tests/component/**/*.test.ts",
  ],
},
```

Each component test file declares its Nuxt environment at the top:

```ts
// @vitest-environment nuxt
```

This boots a minimal Nuxt test context so auto-imports (`NuxtLink`, composables) resolve inside `mountSuspended`.

### 4.3 Test cases (4 total)

1. Both `prev` and `next` null → the outer `<nav v-if>` hides; no DOM nav rendered
2. `prev` provided, `next` null → only previous link renders; href matches `/writing/<slug>`; title text present; "next" text absent
3. `next` provided, `prev` null → mirror of case 2
4. Both provided → both links render with correct hrefs

Each case mounts via `mountSuspended(PostNav, { props: { ... } })` and asserts on `wrapper.find(...)` / `wrapper.text()`.

### 4.4 Precedent

This is the first component test in the repo. Future presentation-component tests follow the same shape: `// @vitest-environment nuxt`, `mountSuspended`, one `describe` per component, one `it` per branch.

`@nuxt/test-utils` is already installed (Plan 2). No new deps.

---

## 5. Unit test backfill

### 5.1 `useReveal` (+1 test)

Append to `tests/unit/useReveal.test.ts`:

- **`when once is false, flips visible back to false on exit`** — uses the existing `MockIO` to fire `isIntersecting: true` → expect `visible = true` → fire `isIntersecting: false` → expect `visible = false`.

### 5.2 `useTyping` (+3 tests)

Append to `tests/unit/useTyping.test.ts`:

- **`stop() halts typing mid-stream`** — advance fake timers partway, call `stop()`, advance further, assert `displayed` unchanged
- **`reset() clears displayed and resets done flag`** — run to completion, assert `done: true`, call `reset()`, assert `displayed: ""` and `done: false`
- **`done flag flips true when typing completes`** — verify state transition

### 5.3 `useCommandKey` (new file, +6 tests)

New file `tests/unit/useKeyboard.test.ts`:

- **fires on Meta+K and calls preventDefault**
- **fires on Ctrl+K**
- **case-insensitive** (fires on both `"K"` and `"k"`)
- **does not fire on plain K** (no modifier)
- **does not fire on Meta+J** (different key)
- **removes listener on unmount**

All cases mount a minimal `defineComponent` harness via `@vue/test-utils`' `mount`, use `useCommandKey(handler)` in setup, dispatch `KeyboardEvent`s on `window`, and assert handler call counts.

### 5.4 Test count after Plan 4

| Layer | Before | After | Delta |
| --- | --- | --- | --- |
| Unit tests | 39 | 49 | +10 (useReveal +1, useTyping +3, useCommandKey +6) |
| Component tests | 0 | 4 | +4 (PostNav) |
| **Total `pnpm test:unit`** | **39** | **53** | **+14** |
| E2E (`pnpm test:e2e`) | 14 | 14 | 0 |

---

## 6. File structure (produced by this plan)

```
.github/
└── workflows/
    └── ci.yml                         # new
lighthouserc.json                       # new
tests/
├── unit/
│   ├── useReveal.test.ts               # modified (+1)
│   ├── useTyping.test.ts               # modified (+3)
│   └── useKeyboard.test.ts             # new (+6)
└── component/
    └── PostNav.test.ts                 # new (+4)
vitest.config.ts                        # modified (include component dir)
```

---

## 7. Testing the testing

Local verification of Plan 4 itself:

- `pnpm test:unit` — 53 tests pass (49 unit + 4 component in the same run)
- `pnpm test:e2e` — 14 tests pass, unchanged
- `pnpm generate` — succeeds, writes `.output/public/`
- `npx -y @lhci/cli@latest autorun --config=lighthouserc.json` — produces a local report; Accessibility = 100 on all 5 URLs; Performance/BP/SEO warnings (if any) are visible but not blocking
- Trigger a PR that deliberately tanks accessibility (e.g. remove all `alt=""` from `ProjectCard`) — CI fails loudly on the `lighthouse` job

---

## 8. Open questions (to decide during implementation)

1. **LHCI Node compatibility** — `@lhci/cli` historically lagged on latest-Node support. Verify it runs on the repo's pinned Node version; if not, pin LHCI Node to `lts/*` within the lighthouse job only.
2. **Playwright browser cache** — Playwright's browser binaries aren't part of pnpm's cache; the `playwright install` step runs on every CI run. If this becomes a bottleneck, add a separate `actions/cache@v4` step keyed on Playwright version. Defer unless CI time balloons.
3. **`packageManager` field** — if `package.json` doesn't already declare `"packageManager": "pnpm@10.33.0"`, add it so corepack resolves deterministically. One-line addition during implementation.

---

## 9. Out of scope for v1 (future work)

- Visual regression baselines
- Coverage threshold enforcement
- `/resume` in the Lighthouse URL set (once hydration-noise is characterized)
- Cross-browser E2E (Firefox, WebKit) — Chromium-only for now
- Bundle size budget enforcement (`.output/public` total, individual route chunks)
- Accessibility linting (axe-core as pre-commit or LHCI supplement)
- Dependency vulnerability audit gate (`pnpm audit` non-zero on high severity)
