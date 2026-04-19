# CI and Test-Coverage Hardening — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4-job GitHub Actions CI pipeline that runs unit + component + E2E tests plus Lighthouse CI against the static build on every PR, backfill uncovered motion-primitive branches with new tests, and establish the first component-level test as a precedent.

**Architecture:** Pure test additions to the existing Vitest + Playwright harness. A `lighthouserc.json` at repo root configures LHCI to audit 5 static routes with hybrid enforcement (a11y strict, perf/bp/seo warn). A single `.github/workflows/ci.yml` orchestrates four parallel-where-possible jobs (unit, e2e, build, lighthouse) using pnpm via corepack and the Node version pinned in `.nvmrc`.

**Tech Stack:** GitHub Actions, `@lhci/cli`, Vitest, `@nuxt/test-utils/runtime` (`mountSuspended`), `@vue/test-utils`, `@playwright/test` (all already installed).

**Spec reference:** `docs/superpowers/specs/2026-04-19-ci-and-test-coverage-design.md`

---

## File Structure (produced by this plan)

```
.github/
└── workflows/
    └── ci.yml                         # new — 4-job CI workflow
lighthouserc.json                       # new — LHCI config
package.json                            # modified — add packageManager field if absent
vitest.config.ts                        # modified — include component tests
tests/
├── unit/
│   ├── useReveal.test.ts               # modified (+1 test)
│   ├── useTyping.test.ts               # modified (+3 tests)
│   └── useKeyboard.test.ts             # new (+6 tests)
└── component/
    └── PostNav.test.ts                 # new (+4 tests)
```

---

## Phase 0 — Prerequisite: deterministic pnpm

### Task 1: Add `packageManager` field to `package.json`

CI uses corepack to resolve pnpm, which reads the `packageManager` field. Without it, corepack prompts interactively or falls back to an ambient version. Pin deterministically.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check current state**

Run: `grep '"packageManager"' package.json || echo "ABSENT"`

If ABSENT, proceed to Step 2. If present with a pnpm pin, skip to the commit step (this task is a no-op).

- [ ] **Step 2: Add the field**

Use `pnpm --version` to get the currently-installed version, then add a `"packageManager"` top-level field to `package.json`. If pnpm reports `10.33.0`:

```json
"packageManager": "pnpm@10.33.0"
```

Place it alphabetically between existing top-level keys (typically between `name` and `private`, or wherever fits the existing ordering).

- [ ] **Step 3: Verify**

Run: `corepack enable && corepack prepare pnpm@$(pnpm --version) --activate`
Expected: no error; corepack accepts the version.

Run: `pnpm install --frozen-lockfile`
Expected: no lockfile changes.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "$(cat <<'EOF'
chore: pin pnpm via packageManager field for deterministic corepack

Needed by CI so corepack resolves pnpm non-interactively.
EOF
)"
```

If the field was already present (Step 1 didn't hit ABSENT), skip this commit — there's nothing to add.

---

## Phase 1 — Test backfill

### Task 2: `useReveal` — `once: false` backfill

**Files:**
- Modify: `tests/unit/useReveal.test.ts`

- [ ] **Step 1: Read existing file**

Confirm the current structure: imports `MockIO` helper, has one `it("sets visible true when element intersects", ...)` test, sets up `vi.stubGlobal("IntersectionObserver", MockIO)`.

- [ ] **Step 2: Append the new test inside the existing `describe` block**

Add after the existing test:

```ts
  it("when once is false, flips visible back to false on exit", async () => {
    vi.stubGlobal("IntersectionObserver", MockIO);
    const el = document.createElement("div");
    const target = ref<HTMLElement | null>(el);
    const { visible } = useReveal(target, { once: false });
    await nextTick();
    const observer = MockIO.instances[MockIO.instances.length - 1];
    observer.fire(true, el);
    expect(visible.value).toBe(true);
    observer.fire(false, el);
    expect(visible.value).toBe(false);
  });
```

- [ ] **Step 3: Run**

Run: `pnpm test:unit`
Expected: 40/40 pass (39 prior + 1 new).

- [ ] **Step 4: Commit**

```bash
git add tests/unit/useReveal.test.ts
git commit -m "test(useReveal): cover once:false exit path"
```

---

### Task 3: `useTyping` — `stop()`, `reset()`, `done` backfill

**Files:**
- Modify: `tests/unit/useTyping.test.ts`

- [ ] **Step 1: Read existing file**

Confirm the current structure: two tests (progressive typing with fake timers, and reduced-motion instant render).

- [ ] **Step 2: Append three new tests inside the existing `describe` block**

Add after the last existing test:

```ts
  it("stop() halts typing mid-stream and displayed freezes at current index", () => {
    vi.useFakeTimers();
    const { displayed, start, stop } = useTyping({ text: "hello", speed: 50 });
    start();
    vi.advanceTimersByTime(150);
    expect(displayed.value).toBe("hel");
    stop();
    vi.advanceTimersByTime(200);
    expect(displayed.value).toBe("hel");
    vi.useRealTimers();
  });

  it("reset() clears displayed and resets done flag", () => {
    vi.useFakeTimers();
    const { displayed, done, start, reset } = useTyping({ text: "hi", speed: 50 });
    start();
    vi.advanceTimersByTime(200);
    expect(displayed.value).toBe("hi");
    expect(done.value).toBe(true);
    reset();
    expect(displayed.value).toBe("");
    expect(done.value).toBe(false);
    vi.useRealTimers();
  });

  it("done flag flips true when typing completes", () => {
    vi.useFakeTimers();
    const { done, start } = useTyping({ text: "hi", speed: 50 });
    expect(done.value).toBe(false);
    start();
    vi.advanceTimersByTime(200);
    expect(done.value).toBe(true);
    vi.useRealTimers();
  });
```

- [ ] **Step 3: Run**

Run: `pnpm test:unit`
Expected: 43/43 pass (40 after Task 2 + 3 new).

- [ ] **Step 4: Commit**

```bash
git add tests/unit/useTyping.test.ts
git commit -m "test(useTyping): cover stop, reset, and done flag branches"
```

---

### Task 4: `useCommandKey` — new test file

**Files:**
- Create: `tests/unit/useKeyboard.test.ts`

- [ ] **Step 1: Create the file with all six tests**

```ts
// tests/unit/useKeyboard.test.ts
import { describe, it, expect, vi, afterEach } from "vitest";
import { defineComponent, h } from "vue";
import { mount } from "@vue/test-utils";
import { useCommandKey } from "~/composables/useKeyboard";

const makeHarness = (handler: () => void) =>
  defineComponent({
    setup() {
      useCommandKey(handler);
      return () => h("div");
    },
  });

describe("useCommandKey", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fires handler on Meta+K and calls preventDefault", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      cancelable: true,
    });
    const preventSpy = vi.spyOn(event, "preventDefault");
    window.dispatchEvent(event);
    expect(handler).toHaveBeenCalledOnce();
    expect(preventSpy).toHaveBeenCalledOnce();
  });

  it("fires handler on Ctrl+K", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    );
    expect(handler).toHaveBeenCalledOnce();
  });

  it("is case-insensitive (fires on Meta+K and Meta+k)", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "K", metaKey: true })
    );
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("does not fire on plain K without modifier", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k" }));
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not fire on Meta+J (different key)", () => {
    const handler = vi.fn();
    mount(makeHarness(handler));
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "j", metaKey: true })
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it("removes listener on unmount", () => {
    const handler = vi.fn();
    const wrapper = mount(makeHarness(handler));
    wrapper.unmount();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
    expect(handler).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run**

Run: `pnpm test:unit`
Expected: 49/49 pass (43 after Task 3 + 6 new).

- [ ] **Step 3: Commit**

```bash
git add tests/unit/useKeyboard.test.ts
git commit -m "test(useCommandKey): add full test coverage (6 cases)"
```

---

## Phase 2 — First component test

### Task 5: `PostNav` component test + vitest config update

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/component/PostNav.test.ts`

- [ ] **Step 1: Update `vitest.config.ts`**

Read the current file. It should look roughly like:

```ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

Change the `include` array to add the component tests path:

```ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    include: [
      "tests/unit/**/*.test.ts",
      "tests/component/**/*.test.ts",
    ],
  },
});
```

- [ ] **Step 2: Create `tests/component/PostNav.test.ts`**

```ts
// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import PostNav from "~/components/writing/PostNav.vue";

describe("PostNav", () => {
  it("renders nothing when both prev and next are null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: { prev: null, next: null },
    });
    expect(wrapper.find("nav").exists()).toBe(false);
  });

  it("renders only the previous link when prev is provided and next is null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: { slug: "older-post", title: "Older Post" },
        next: null,
      },
    });
    expect(wrapper.text()).toContain("previous");
    expect(wrapper.text()).toContain("Older Post");
    expect(wrapper.text()).not.toContain("next");
    expect(wrapper.find(`a[href="/writing/older-post"]`).exists()).toBe(true);
  });

  it("renders only the next link when next is provided and prev is null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: null,
        next: { slug: "newer-post", title: "Newer Post" },
      },
    });
    expect(wrapper.text()).toContain("next");
    expect(wrapper.text()).toContain("Newer Post");
    expect(wrapper.text()).not.toContain("previous");
    expect(wrapper.find(`a[href="/writing/newer-post"]`).exists()).toBe(true);
  });

  it("renders both links when both are provided", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: { slug: "older", title: "Older" },
        next: { slug: "newer", title: "Newer" },
      },
    });
    expect(wrapper.text()).toContain("previous");
    expect(wrapper.text()).toContain("next");
    expect(wrapper.find(`a[href="/writing/older"]`).exists()).toBe(true);
    expect(wrapper.find(`a[href="/writing/newer"]`).exists()).toBe(true);
  });
});
```

- [ ] **Step 3: Run**

Run: `pnpm test:unit`
Expected: 53/53 pass (49 after Task 4 + 4 new component tests).

Note: the first run may be slower than subsequent — `@vitest-environment nuxt` boots a minimal Nuxt context. If this fails with "cannot find @nuxt/test-utils/runtime", verify `@nuxt/test-utils` is in devDependencies (it is — from Plan 2) and that the import path is correct.

If `mountSuspended` throws something about Nuxt app not being available, check that the `// @vitest-environment nuxt` comment is on the FIRST line of the file (before any imports). Vitest reads it as a directive comment only from line 1.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts tests/component/PostNav.test.ts
git commit -m "test(PostNav): component test covering 3 v-if branches + baseline"
```

---

## Phase 3 — Lighthouse configuration

### Task 6: `lighthouserc.json`

**Files:**
- Create: `lighthouserc.json`

- [ ] **Step 1: Write the file**

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

Note the `jsonc` shape is just comment support — the file should be valid JSON. Remove the `//` line in `staticDistDir` if you see it; we're not adding any comments.

- [ ] **Step 2: Local dry-run**

```bash
pnpm generate
npx -y @lhci/cli@latest autorun --config=lighthouserc.json
```

Expected output:
- LHCI starts its static server, audits 5 URLs
- Summary table shows scores for all 4 categories per URL
- Accessibility column should be 100 on every URL (the current site already passes this)
- Exit code 0 if all assertions pass; non-zero if the a11y `error` rule fires

If a11y scores below 100 on any URL, LHCI exits non-zero and prints which audit failed. That's a REAL finding to address — STOP and report, don't commit.

If performance/bp/seo drop below the warn thresholds, LHCI exits 0 with warnings printed; that's fine.

- [ ] **Step 3: Commit**

```bash
git add lighthouserc.json
git commit -m "chore(ci): add Lighthouse CI config (a11y strict, perf/bp/seo warn)"
```

---

## Phase 4 — GitHub Actions workflow

### Task 7: `.github/workflows/ci.yml`

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: CI

on:
  push:
    branches: [master]
  pull_request:
    branches: [master]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  unit:
    name: Unit + component tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit

  e2e:
    name: Playwright E2E
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx playwright install --with-deps chromium
      - run: pnpm test:e2e

  build:
    name: Static build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - run: pnpm generate
      - uses: actions/upload-artifact@v4
        with:
          name: static-output
          path: .output/public
          retention-days: 1

  lighthouse:
    name: Lighthouse CI
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: ".nvmrc"
          cache: "pnpm"
      - run: corepack enable
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v4
        with:
          name: static-output
          path: .output/public
      - run: npx -y @lhci/cli@latest autorun --config=lighthouserc.json
```

### Configuration notes (for the engineer executing this plan)

- **Node version** — `actions/setup-node@v4`'s `node-version-file: ".nvmrc"` reads the Node version from the repo's `.nvmrc`. Keeps CI aligned with local development.
- **`corepack enable`** — activates pnpm per the `packageManager` field added in Task 1. Without this, `pnpm` is not available on PATH.
- **pnpm cache** — built into `actions/setup-node@v4`. Persists `~/.local/share/pnpm/store/v3` across runs when the lockfile hash matches.
- **`--frozen-lockfile`** — CI fails fast if `pnpm-lock.yaml` is out of sync with `package.json`. Standard for CI.
- **Artifact passing** — the `build` job produces `.output/public/`, uploaded as an artifact; `lighthouse` downloads it. Cheaper than rebuilding.
- **`npx -y @lhci/cli@latest`** — pulls a fresh LHCI on every run; no need to add `@lhci/cli` as a dev dep.
- **No `fail-fast: false` matrix** — since we don't have a matrix, this is a no-op.

- [ ] **Step 2: Syntax-check the YAML**

Most editors catch basic YAML syntax errors. If you have `actionlint` installed locally, run:

```bash
actionlint .github/workflows/ci.yml
```

Expected: no errors.

If you don't have actionlint, visual-inspect the indentation (YAML is whitespace-sensitive) — each job's `steps:` should be indented one level under the job name.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add 4-job workflow (unit, e2e, build, lighthouse)"
```

---

## Phase 5 — End-to-end CI verification

### Task 8: Push the branch and watch CI

**Files:** none — this task observes behavior, not code.

- [ ] **Step 1: Confirm local tests still pass**

```bash
pnpm test:unit
pnpm test:e2e
pnpm generate
```

Expected:
- `test:unit`: 53/53 pass (39 from Plan 3 + 14 backfills)
- `test:e2e`: 14/14 pass
- `generate`: 28 routes prerendered, no errors

- [ ] **Step 2: Push the feature branch**

Assume the work is on a branch like `ci/test-coverage` (or whatever the executor created — the actual branch name doesn't matter):

```bash
git push -u origin HEAD
```

- [ ] **Step 3: Observe the first CI run**

Check the Actions tab on GitHub for this repo. You can also use `gh run watch` if the `gh` CLI is configured:

```bash
gh run watch
```

Expected: 4 jobs run concurrently (`unit`, `e2e`, `build` in parallel; `lighthouse` follows `build`). Total wall-clock ~4–6 minutes on first run (pnpm install is uncached).

**Job outcomes:**

- **`unit`** — 53/53 pass. Expected duration: 30–60s.
- **`e2e`** — 14/14 pass. Expected duration: 2–3 min. Playwright's first install of Chromium adds ~45s.
- **`build`** — green. `pnpm generate` produces `.output/public/`. Expected: 1 min.
- **`lighthouse`** — green (all 5 URLs meet a11y = 100). Performance/BP/SEO may warn — that's acceptable. LHCI prints a temporary public report URL in the log.

If `unit` or `e2e` fails in CI but passed locally, common causes:
- A headless-mode difference (Playwright sometimes behaves differently without a visible browser)
- Timing-sensitive test that's fine on a fast local machine but flaky on CI's shared runner
- An environment-variable or CWD assumption that's not portable

If `lighthouse` fails with a11y < 100, that's a REAL accessibility regression — STOP and fix (this is the whole point of the gate). Open the LHCI report URL from the log to see which audit failed.

- [ ] **Step 4: Open the PR**

Once all 4 jobs are green on the branch:

```bash
gh pr create --base master --head <branch> --title "CI and test-coverage hardening" --body "..."
```

PR body template (adapt as needed):

```markdown
## Summary

Implements Plan 4 — CI + test-coverage hardening.

- `.github/workflows/ci.yml` — 4-job workflow (unit, e2e, build, lighthouse)
- `lighthouserc.json` — Lighthouse CI config with hybrid enforcement (a11y = 100 strict, perf/bp/seo warn)
- Unit backfill: `useReveal` (+1), `useTyping` (+3), `useCommandKey` (+6 new file)
- First component test: `PostNav` (+4 via @nuxt/test-utils' `mountSuspended`)
- `package.json` pinned via `packageManager` field for deterministic corepack

## Test plan

- [ ] `pnpm test:unit` — 53/53 pass (49 unit + 4 component)
- [ ] `pnpm test:e2e` — 14/14 pass
- [ ] `pnpm generate` — succeeds
- [ ] CI: all 4 jobs green on this branch
- [ ] LHCI report link accessible from run log; a11y = 100 on all 5 URLs
```

---

## Final verification

After Task 8 completes and all jobs are green on the branch:

- `pnpm test:unit` locally — **53 tests** pass
- `pnpm test:e2e` locally — **14 tests** pass (unchanged)
- GitHub Actions run on the branch — **4 green jobs**
- LHCI public report URL visible in the `lighthouse` job log
- A PR is open, ready for review and merge

---

## Self-review notes

**Spec coverage:** every spec section maps to a task:
- §2 GitHub Actions workflow → Tasks 1, 7
- §3 Lighthouse config → Task 6
- §4 PostNav component test → Task 5
- §5 Motion primitive backfill → Tasks 2, 3, 4
- §6 File structure → all tasks
- §7 Testing the testing → Task 8

**No placeholders:** every code block has complete content. The one place a verification step can "fail" in a meaningful-to-real-life way is Task 8 Step 3 (LHCI a11y miss); that's not a placeholder, it's a deliberate fail-loud gate.

**Type consistency:** test imports (`useReveal`, `useTyping`, `useCommandKey`, `mountSuspended`, `mount`) match their real export signatures in the repo. `PostNav` props (`prev?: PostRef | null`, `next?: PostRef | null`) match the component's actual declaration.

## Open items resolved during implementation

- **LHCI Node compatibility** (spec §8.1) — `@lhci/cli` supports Node 20+. The repo's `.nvmrc` pins a compatible version. No action needed unless a future `.nvmrc` bump breaks this.
- **Playwright browser cache** (spec §8.2) — deferred; re-evaluate if CI time grows
- **`packageManager` field** (spec §8.3) — handled in Task 1.
