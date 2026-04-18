# digitalseraph-vue — Foundation & Landing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed, navigable digitalseraph.com with landing page, working navigation (topbar + ⌘K palette), theme toggle, motion primitives, and placeholder About/Work/Writing/Contact routes. Follow-up plans deliver the resume sub-system, writing pipeline, and full test coverage.

**Architecture:** Nuxt (latest stable) static site generated to Cloudflare Pages. Tailwind v4 with tokens in a single `@theme` CSS block. Pinia for theme + motion state. Composable-based motion primitives (`useParallax`, `useReveal`, `useTyping`, `useScrollY`) with a singleton scroll listener for performance. @nuxt/content seeded with placeholder entries so cards and teasers render from real data.

**Tech Stack:** Nuxt, Vue 3, TypeScript strict, Tailwind CSS v4, Pinia, @nuxt/content, motion-v (Motion for Vue), Vitest, Playwright, Cloudflare Pages via Wrangler.

**Spec reference:** `docs/superpowers/specs/2026-04-18-digitalseraph-vue-design.md`

---

## File Structure (produced by this plan)

```
web/digitalseraph-vue/
├── .editorconfig
├── .gitignore
├── .nvmrc
├── CLAUDE.md
├── README.md
├── app.vue
├── nuxt.config.ts
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── wrangler.toml
├── assets/
│   └── css/
│       ├── tokens.css
│       └── main.css
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
│   └── primitives/
│       ├── GridBackdrop.vue
│       ├── TerminalPrompt.vue
│       ├── SectionReveal.vue
│       ├── TagChip.vue
│       ├── PillLink.vue
│       ├── CopyInline.vue
│       ├── ProjectCard.vue
│       └── PostCard.vue
├── composables/
│   ├── useScrollY.ts
│   ├── useParallax.ts
│   ├── useReveal.ts
│   ├── useTyping.ts
│   └── useKeyboard.ts
├── content/
│   ├── about.md
│   ├── resume.yml
│   ├── work/
│   │   ├── 01-project-one.md
│   │   ├── 02-project-two.md
│   │   └── 03-project-three.md
│   └── writing/
│       ├── 2026-03-12-first-post.md
│       └── 2026-02-04-second-post.md
├── pages/
│   ├── index.vue
│   ├── about.vue
│   ├── contact.vue
│   ├── resume.vue
│   ├── work/
│   │   ├── index.vue
│   │   └── [slug].vue
│   └── writing/
│       ├── index.vue
│       └── [slug].vue
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── fonts/
│   │   ├── JetBrainsMono-Regular.woff2
│   │   ├── JetBrainsMono-Bold.woff2
│   │   ├── SpaceGrotesk-Regular.woff2
│   │   ├── SpaceGrotesk-Medium.woff2
│   │   └── SpaceGrotesk-SemiBold.woff2
│   └── og/
│       ├── project-one.svg
│       ├── project-two.svg
│       └── project-three.svg
├── stores/
│   ├── theme.ts
│   └── motion.ts
├── tests/
│   ├── unit/
│   │   ├── useScrollY.test.ts
│   │   ├── useParallax.test.ts
│   │   ├── useReveal.test.ts
│   │   ├── useTyping.test.ts
│   │   ├── theme.test.ts
│   │   └── motion.test.ts
│   └── e2e/
│       ├── playwright.config.ts
│       └── smoke.spec.ts
└── vitest.config.ts
```

---

## Phase 0 — Scaffold

### Task 1: Create Nuxt scaffold

**Files:**
- Create: `web/digitalseraph-vue/` (entire Nuxt project)

- [ ] **Step 1: Verify parent exists**

Run: `ls web/`
Expected: `improbica-web` is listed.

- [ ] **Step 2: Scaffold Nuxt app**

Run from repo root:
```bash
pnpm dlx nuxi@latest init digitalseraph-vue --package-manager pnpm --no-gitInit --template v4
cd web/
# if nuxi created at repo root, move it:
# mv ../digitalseraph-vue .
cd digitalseraph-vue
```

If `nuxi init` placed the project elsewhere (e.g. repo root), move the resulting directory into `web/`.

Expected: `web/digitalseraph-vue/package.json` exists with `nuxt` dependency.

- [ ] **Step 3: Pin Node version**

Create `web/digitalseraph-vue/.nvmrc` containing the Node LTS you're developing against (e.g. `20.18.0`).

- [ ] **Step 4: Verify dev server boots**

```bash
cd web/digitalseraph-vue
pnpm install
pnpm dev
```

Expected: Nuxt welcome screen at `http://localhost:3000`. Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add web/digitalseraph-vue
git commit -m "feat(digitalseraph-vue): scaffold Nuxt app"
```

---

### Task 2: Install styling, state, content, motion dependencies

**Files:**
- Modify: `web/digitalseraph-vue/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd web/digitalseraph-vue
pnpm add pinia @pinia/nuxt @nuxt/content motion-v @vueuse/core
```

- [ ] **Step 2: Install dev deps**

```bash
pnpm add -D tailwindcss @tailwindcss/vite vitest @vue/test-utils @nuxt/test-utils happy-dom @playwright/test typescript
```

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat(digitalseraph-vue): add styling, state, content, motion deps"
```

---

### Task 3: Configure Nuxt, Tailwind v4, TypeScript strict

**Files:**
- Modify: `web/digitalseraph-vue/nuxt.config.ts`
- Create: `web/digitalseraph-vue/assets/css/main.css`
- Modify: `web/digitalseraph-vue/tsconfig.json`

- [ ] **Step 1: Write `nuxt.config.ts`**

```ts
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2026-04-18",
  devtools: { enabled: true },

  modules: [
    "@pinia/nuxt",
    "@nuxt/content",
  ],

  css: ["~/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      title: "digitalseraph",
      meta: [
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "David Miller — engineer, builder, maker." },
      ],
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  content: {
    highlight: false,
  },

  nitro: {
    preset: "cloudflare-pages",
    prerender: {
      crawlLinks: true,
      routes: ["/"],
    },
  },
});
```

- [ ] **Step 2: Write `assets/css/main.css`**

```css
@import "tailwindcss";
@import "./tokens.css";

html, body, #__nuxt { height: 100%; }
body {
  background: var(--canvas);
  color: var(--text);
  font-family: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  font-feature-settings: "ss01", "cv01";
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}
```

- [ ] **Step 3: Update `tsconfig.json`**

Ensure `"strict": true` in `compilerOptions`:

```json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": {
    "strict": true
  }
}
```

- [ ] **Step 4: Verify dev server still boots**

```bash
pnpm dev
```
Expected: page loads without errors. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts tsconfig.json assets/
git commit -m "feat(digitalseraph-vue): configure Nuxt, Tailwind v4, TS strict"
```

---

## Phase 1 — Design tokens and fonts

### Task 4: Define CSS tokens and Tailwind @theme

**Files:**
- Create: `web/digitalseraph-vue/assets/css/tokens.css`

- [ ] **Step 1: Write `tokens.css`**

```css
@theme {
  --color-canvas: #0a0a0a;
  --color-canvas-raised: #111114;
  --color-line: rgba(255, 255, 255, 0.08);
  --color-text: #fafafa;
  --color-text-muted: #a3a3a3;
  --color-text-dim: #525252;
  --color-accent: #22c55e;
  --color-accent-glow: rgba(34, 197, 94, 0.35);
  --color-grid-line: rgba(255, 255, 255, 0.04);

  --font-display: "Space Grotesk", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-display-xl: 4.5rem;
  --text-display-l: 3rem;
  --text-display-m: 2rem;
  --text-body-l: 1.125rem;
  --text-body: 1rem;
  --text-mono-l: 1rem;
  --text-mono: 0.8125rem;
  --text-label: 0.6875rem;

  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 10px;
}

:root {
  --canvas: var(--color-canvas);
  --canvas-raised: var(--color-canvas-raised);
  --line: var(--color-line);
  --text: var(--color-text);
  --text-muted: var(--color-text-muted);
  --text-dim: var(--color-text-dim);
  --accent: var(--color-accent);
  --accent-glow: var(--color-accent-glow);
  --grid-line: var(--color-grid-line);
  color-scheme: dark;
}

:root[data-theme="light"] {
  --canvas: #fafaf9;
  --canvas-raised: #f5f5f4;
  --line: rgba(10, 10, 10, 0.1);
  --text: #1c1917;
  --text-muted: #57534e;
  --text-dim: #a8a29e;
  --grid-line: rgba(10, 10, 10, 0.04);
  color-scheme: light;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
  }
}
```

- [ ] **Step 2: Verify Tailwind utilities resolve**

Create a throwaway test in `pages/index.vue`:

```vue
<template>
  <div class="bg-canvas text-accent p-8 font-mono">digitalseraph tokens wired</div>
</template>
```

Run `pnpm dev`. Expected: dark background, green text, monospace font. Revert this change (the real `pages/index.vue` is built later).

- [ ] **Step 3: Commit**

```bash
git checkout pages/index.vue
git add assets/css/tokens.css
git commit -m "feat(digitalseraph-vue): add color, type, radii tokens"
```

---

### Task 5: Self-host Space Grotesk and JetBrains Mono

**Files:**
- Create: `web/digitalseraph-vue/public/fonts/*.woff2` (5 files)
- Modify: `web/digitalseraph-vue/assets/css/tokens.css`

- [ ] **Step 1: Download fonts**

Download `.woff2` files from Google Fonts or the publishers' repos. Place in `web/digitalseraph-vue/public/fonts/` (note: `public/`, not `assets/`, so URLs resolve as `/fonts/...` without Vite asset rewriting):
- `SpaceGrotesk-Regular.woff2`
- `SpaceGrotesk-Medium.woff2`
- `SpaceGrotesk-SemiBold.woff2`
- `JetBrainsMono-Regular.woff2`
- `JetBrainsMono-Bold.woff2`

- [ ] **Step 2: Add `@font-face` declarations**

Append to `assets/css/tokens.css`:

```css
@font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/SpaceGrotesk-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/SpaceGrotesk-Medium.woff2") format("woff2");
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: "Space Grotesk";
  src: url("/fonts/SpaceGrotesk-SemiBold.woff2") format("woff2");
  font-weight: 600;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Regular.woff2") format("woff2");
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: "JetBrains Mono";
  src: url("/fonts/JetBrainsMono-Bold.woff2") format("woff2");
  font-weight: 700;
  font-display: swap;
}
```

- [ ] **Step 3: Verify in dev**

```bash
pnpm dev
```
Open DevTools > Network > Filter "Font". Expected: both font families load as woff2, no 404s.

- [ ] **Step 4: Commit**

```bash
git add assets/fonts assets/css/tokens.css
git commit -m "feat(digitalseraph-vue): self-host Space Grotesk and JetBrains Mono"
```

---

## Phase 2 — Pinia stores

### Task 6: Theme store with persistence

**Files:**
- Create: `web/digitalseraph-vue/stores/theme.ts`
- Test: `web/digitalseraph-vue/tests/unit/theme.test.ts`
- Create: `web/digitalseraph-vue/vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

Add script to `package.json`:

```json
"scripts": {
  "test:unit": "vitest run",
  "test:unit:watch": "vitest"
}
```

- [ ] **Step 2: Write failing test `tests/unit/theme.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useThemeStore } from "~/stores/theme";

describe("theme store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to dark", () => {
    const theme = useThemeStore();
    expect(theme.mode).toBe("dark");
  });

  it("reads stored preference if present", () => {
    localStorage.setItem("ds-theme", "light");
    const theme = useThemeStore();
    theme.init();
    expect(theme.mode).toBe("light");
  });

  it("toggle flips mode and persists", () => {
    const theme = useThemeStore();
    theme.init();
    theme.toggle();
    expect(theme.mode).toBe("light");
    expect(localStorage.getItem("ds-theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
```

- [ ] **Step 3: Run test — expect FAIL**

```bash
pnpm test:unit
```
Expected: FAIL (`useThemeStore` not found).

- [ ] **Step 4: Implement `stores/theme.ts`**

```ts
import { defineStore } from "pinia";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "ds-theme";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "dark" as ThemeMode,
  }),
  actions: {
    init() {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        this.mode = stored;
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        this.mode = "light";
      } else {
        this.mode = "dark";
      }
      this.apply();
    },
    toggle() {
      this.mode = this.mode === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, this.mode);
      }
      this.apply();
    },
    apply() {
      if (typeof document === "undefined") return;
      if (this.mode === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    },
  },
});
```

- [ ] **Step 5: Run test — expect PASS**

```bash
pnpm test:unit
```
Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json pnpm-lock.yaml stores/theme.ts tests/unit/theme.test.ts
git commit -m "feat(digitalseraph-vue): theme store with persistence"
```

---

### Task 7: Motion store (reduced-motion detection)

**Files:**
- Create: `web/digitalseraph-vue/stores/motion.ts`
- Test: `web/digitalseraph-vue/tests/unit/motion.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMotionStore } from "~/stores/motion";

describe("motion store", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("detects reduced-motion preference", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const motion = useMotionStore();
    motion.init();
    expect(motion.reduced).toBe(true);
  });

  it("defaults to not reduced when query unmatched", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const motion = useMotionStore();
    motion.init();
    expect(motion.reduced).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `stores/motion.ts`**

```ts
import { defineStore } from "pinia";

export const useMotionStore = defineStore("motion", {
  state: () => ({
    reduced: false,
  }),
  actions: {
    init() {
      if (typeof window === "undefined") return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reduced = mq.matches;
      mq.addEventListener("change", (e) => { this.reduced = e.matches; });
    },
  },
});
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add stores/motion.ts tests/unit/motion.test.ts
git commit -m "feat(digitalseraph-vue): motion store with reduced-motion detection"
```

---

## Phase 3 — Motion composables

### Task 8: `useScrollY` — singleton rAF scroll store

**Files:**
- Create: `web/digitalseraph-vue/composables/useScrollY.ts`
- Test: `web/digitalseraph-vue/tests/unit/useScrollY.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useScrollY, __resetScrollY } from "~/composables/useScrollY";

describe("useScrollY", () => {
  beforeEach(() => {
    __resetScrollY();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
  });

  it("returns a reactive ref initialized to window.scrollY", () => {
    Object.defineProperty(window, "scrollY", { value: 42, writable: true, configurable: true });
    const y = useScrollY();
    expect(y.value).toBe(42);
  });

  it("multiple calls share the same ref (singleton)", () => {
    const a = useScrollY();
    const b = useScrollY();
    expect(a).toBe(b);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `composables/useScrollY.ts`**

```ts
import { ref, type Ref } from "vue";

let singleton: Ref<number> | null = null;
let rafId = 0;
let listening = false;

function tick() {
  if (!singleton) return;
  singleton.value = window.scrollY;
  rafId = 0;
}

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(tick);
}

export function useScrollY(): Ref<number> {
  if (singleton) return singleton;
  const initial = typeof window !== "undefined" ? window.scrollY : 0;
  singleton = ref(initial);
  if (typeof window !== "undefined" && !listening) {
    window.addEventListener("scroll", onScroll, { passive: true });
    listening = true;
  }
  return singleton;
}

export function __resetScrollY() {
  if (typeof window !== "undefined" && listening) {
    window.removeEventListener("scroll", onScroll);
  }
  singleton = null;
  rafId = 0;
  listening = false;
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add composables/useScrollY.ts tests/unit/useScrollY.test.ts
git commit -m "feat(digitalseraph-vue): useScrollY singleton scroll ref"
```

---

### Task 9: `useParallax` composable

**Files:**
- Create: `web/digitalseraph-vue/composables/useParallax.ts`
- Test: `web/digitalseraph-vue/tests/unit/useParallax.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { ref, nextTick } from "vue";
import { useParallax } from "~/composables/useParallax";
import { __resetScrollY } from "~/composables/useScrollY";

describe("useParallax", () => {
  beforeEach(() => {
    __resetScrollY();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
  });

  it("returns a translateY string reflecting scroll * speed", async () => {
    const { transform } = useParallax({ speed: 0.25 });
    Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(transform.value).toBe("translate3d(0, -25px, 0)");
  });

  it("returns translate3d(0,0,0) when reduced motion requested", async () => {
    const { transform } = useParallax({ speed: 0.25, reduced: ref(true) });
    Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(transform.value).toBe("translate3d(0, 0, 0)");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `composables/useParallax.ts`**

```ts
import { computed, type Ref } from "vue";
import { useScrollY } from "./useScrollY";

interface ParallaxOptions {
  speed: number;
  reduced?: Ref<boolean>;
}

export function useParallax(opts: ParallaxOptions) {
  const y = useScrollY();
  const transform = computed(() => {
    if (opts.reduced?.value) return "translate3d(0, 0, 0)";
    const offset = -y.value * opts.speed;
    return `translate3d(0, ${offset}px, 0)`;
  });
  return { transform };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add composables/useParallax.ts tests/unit/useParallax.test.ts
git commit -m "feat(digitalseraph-vue): useParallax composable"
```

---

### Task 10: `useReveal` composable (IntersectionObserver fade-in)

**Files:**
- Create: `web/digitalseraph-vue/composables/useReveal.ts`
- Test: `web/digitalseraph-vue/tests/unit/useReveal.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { ref, nextTick } from "vue";
import { useReveal } from "~/composables/useReveal";

class MockIO {
  static instances: MockIO[] = [];
  callback: IntersectionObserverCallback;
  constructor(cb: IntersectionObserverCallback) {
    this.callback = cb;
    MockIO.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  fire(isIntersecting: boolean, target: Element) {
    this.callback(
      [{ isIntersecting, target, intersectionRatio: isIntersecting ? 1 : 0 } as any],
      this as any
    );
  }
}

describe("useReveal", () => {
  it("sets visible true when element intersects", async () => {
    vi.stubGlobal("IntersectionObserver", MockIO);
    const el = document.createElement("div");
    const target = ref<HTMLElement | null>(el);
    const { visible } = useReveal(target);
    await nextTick();
    expect(visible.value).toBe(false);
    MockIO.instances[MockIO.instances.length - 1].fire(true, el);
    expect(visible.value).toBe(true);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `composables/useReveal.ts`**

```ts
import { ref, watch, onBeforeUnmount, type Ref } from "vue";

interface RevealOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export function useReveal(target: Ref<HTMLElement | null>, opts: RevealOptions = {}) {
  const visible = ref(false);
  let observer: IntersectionObserver | null = null;

  const start = (el: HTMLElement) => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.value = true;
            if (opts.once !== false) observer?.disconnect();
          } else if (opts.once === false) {
            visible.value = false;
          }
        }
      },
      {
        rootMargin: opts.rootMargin ?? "0px 0px -10% 0px",
        threshold: opts.threshold ?? 0.1,
      }
    );
    observer.observe(el);
  };

  watch(
    target,
    (el) => {
      if (el) start(el);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => observer?.disconnect());

  return { visible };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add composables/useReveal.ts tests/unit/useReveal.test.ts
git commit -m "feat(digitalseraph-vue): useReveal IntersectionObserver composable"
```

---

### Task 11: `useTyping` composable

**Files:**
- Create: `web/digitalseraph-vue/composables/useTyping.ts`
- Test: `web/digitalseraph-vue/tests/unit/useTyping.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { ref } from "vue";
import { useTyping } from "~/composables/useTyping";

describe("useTyping", () => {
  it("renders text progressively when started", async () => {
    vi.useFakeTimers();
    const { displayed, start } = useTyping({ text: "hi", speed: 50 });
    expect(displayed.value).toBe("");
    start();
    vi.advanceTimersByTime(50);
    expect(displayed.value).toBe("h");
    vi.advanceTimersByTime(50);
    expect(displayed.value).toBe("hi");
    vi.useRealTimers();
  });

  it("renders full text instantly when reduced motion is set", () => {
    const reduced = ref(true);
    const { displayed, start } = useTyping({ text: "hello", speed: 50, reduced });
    start();
    expect(displayed.value).toBe("hello");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `composables/useTyping.ts`**

```ts
import { ref, type Ref } from "vue";

interface TypingOptions {
  text: string;
  speed?: number;
  reduced?: Ref<boolean>;
}

export function useTyping(opts: TypingOptions) {
  const displayed = ref("");
  const done = ref(false);
  let index = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  const speed = opts.speed ?? 40;

  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
  }

  function start() {
    stop();
    if (opts.reduced?.value) {
      displayed.value = opts.text;
      done.value = true;
      return;
    }
    index = displayed.value.length;
    timer = setInterval(() => {
      index++;
      displayed.value = opts.text.slice(0, index);
      if (index >= opts.text.length) {
        done.value = true;
        stop();
      }
    }, speed);
  }

  function reset() {
    stop();
    displayed.value = "";
    done.value = false;
    index = 0;
  }

  return { displayed, done, start, stop, reset };
}
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add composables/useTyping.ts tests/unit/useTyping.test.ts
git commit -m "feat(digitalseraph-vue): useTyping composable"
```

---

### Task 12: `useKeyboard` composable (global ⌘K)

**Files:**
- Create: `web/digitalseraph-vue/composables/useKeyboard.ts`

- [ ] **Step 1: Implement (no test — thin wrapper)**

```ts
import { onMounted, onBeforeUnmount } from "vue";

export function useCommandKey(handler: () => void) {
  function onKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      handler();
    }
  }
  onMounted(() => window.addEventListener("keydown", onKey));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
}
```

- [ ] **Step 2: Commit**

```bash
git add composables/useKeyboard.ts
git commit -m "feat(digitalseraph-vue): useCommandKey global shortcut"
```

---

## Phase 4 — Primitive components

### Task 13: `GridBackdrop.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/primitives/GridBackdrop.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ speed?: number; glow?: boolean }>(), {
  speed: 0.1,
  glow: true,
});

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform } = useParallax({ speed: props.speed, reduced });
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="absolute inset-0 grid-lines" :style="{ transform }"></div>
    <div v-if="glow" class="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] glow-radial"></div>
  </div>
</template>

<style scoped>
.grid-lines {
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: 0 0;
  will-change: transform;
}
.glow-radial {
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  will-change: transform;
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add components/primitives/GridBackdrop.vue
git commit -m "feat(digitalseraph-vue): GridBackdrop primitive with parallax"
```

---

### Task 14: `TerminalPrompt.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/primitives/TerminalPrompt.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useTyping } from "~/composables/useTyping";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(
  defineProps<{ command: string; autoStart?: boolean; speed?: number; symbol?: string }>(),
  { autoStart: true, speed: 45, symbol: "$" }
);

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { displayed, start } = useTyping({ text: props.command, speed: props.speed, reduced });

onMounted(() => { if (props.autoStart) start(); });

defineExpose({ start });
</script>

<template>
  <div class="font-mono text-[var(--text-mono-l)]">
    <span class="text-[var(--accent)]">{{ symbol }}</span>
    <span class="ml-2 text-[var(--text)]">{{ displayed }}</span>
    <span class="inline-block w-[7px] h-[14px] align-[-2px] ml-1 bg-[var(--accent)] cursor-blink" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add components/primitives/TerminalPrompt.vue
git commit -m "feat(digitalseraph-vue): TerminalPrompt primitive"
```

---

### Task 15: `SectionReveal.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/primitives/SectionReveal.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useReveal } from "~/composables/useReveal";

withDefaults(defineProps<{ stagger?: number; as?: string }>(), { stagger: 80, as: "section" });

const root = ref<HTMLElement | null>(null);
const { visible } = useReveal(root);
</script>

<template>
  <component :is="as" ref="root" :class="['reveal', { 'is-visible': visible }]" :style="{ '--stagger': `${stagger}ms` }">
    <slot />
  </component>
</template>

<style scoped>
.reveal > * {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 520ms cubic-bezier(0.2, 0.6, 0.2, 1), transform 520ms cubic-bezier(0.2, 0.6, 0.2, 1);
}
.reveal.is-visible > * {
  opacity: 1;
  transform: translateY(0);
}
.reveal.is-visible > *:nth-child(2) { transition-delay: calc(var(--stagger) * 1); }
.reveal.is-visible > *:nth-child(3) { transition-delay: calc(var(--stagger) * 2); }
.reveal.is-visible > *:nth-child(4) { transition-delay: calc(var(--stagger) * 3); }
.reveal.is-visible > *:nth-child(5) { transition-delay: calc(var(--stagger) * 4); }
.reveal.is-visible > *:nth-child(n+6) { transition-delay: calc(var(--stagger) * 5); }

@media (prefers-reduced-motion: reduce) {
  .reveal > * { opacity: 1; transform: none; transition: none; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add components/primitives/SectionReveal.vue
git commit -m "feat(digitalseraph-vue): SectionReveal with staggered children"
```

---

### Task 16: `TagChip.vue`, `PillLink.vue`, `CopyInline.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/primitives/TagChip.vue`
- Create: `web/digitalseraph-vue/components/primitives/PillLink.vue`
- Create: `web/digitalseraph-vue/components/primitives/CopyInline.vue`

- [ ] **Step 1: Write `TagChip.vue`**

```vue
<template>
  <span class="inline-block text-[var(--text-muted)] text-[0.625rem] tracking-[0.1em] uppercase px-[7px] py-[3px] rounded-full bg-[var(--line)]">
    <slot />
  </span>
</template>
```

- [ ] **Step 2: Write `PillLink.vue`**

```vue
<script setup lang="ts">
defineProps<{ href: string; external?: boolean }>();
</script>

<template>
  <a
    :href="href"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line)] text-[var(--text)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
  >
    <slot />
  </a>
</template>
```

- [ ] **Step 3: Write `CopyInline.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";
const props = defineProps<{ value: string }>();
const copied = ref(false);

async function copy() {
  if (typeof navigator === "undefined") return;
  await navigator.clipboard.writeText(props.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1400);
}
</script>

<template>
  <button
    type="button"
    @click="copy"
    class="font-mono inline-flex items-center gap-2 underline decoration-dotted underline-offset-4 decoration-[var(--text-dim)] hover:decoration-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    :aria-label="`Copy ${value}`"
  >
    {{ value }}
    <span v-if="copied" class="text-[var(--accent)] text-xs" aria-live="polite">copied</span>
  </button>
</template>
```

- [ ] **Step 4: Commit**

```bash
git add components/primitives/TagChip.vue components/primitives/PillLink.vue components/primitives/CopyInline.vue
git commit -m "feat(digitalseraph-vue): TagChip, PillLink, CopyInline primitives"
```

---

### Task 17: `ProjectCard.vue` and `PostCard.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/primitives/ProjectCard.vue`
- Create: `web/digitalseraph-vue/components/primitives/PostCard.vue`

- [ ] **Step 1: Write `ProjectCard.vue`**

```vue
<script setup lang="ts">
import TagChip from "./TagChip.vue";

defineProps<{
  slug: string;
  title: string;
  year: number;
  role: string;
  summary: string;
  stack: string[];
  cover?: string;
}>();
</script>

<template>
  <NuxtLink
    :to="`/work/${slug}`"
    class="group block rounded-md border border-[var(--line)] bg-[var(--canvas-raised)] p-5 transition-colors hover:border-[var(--accent)]"
  >
    <div v-if="cover" class="mb-4 aspect-[16/9] overflow-hidden rounded-sm bg-[var(--canvas)]">
      <img :src="cover" :alt="''" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
    </div>
    <div class="flex items-baseline justify-between mb-1">
      <h3 class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)]">{{ title }}</h3>
      <span class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">{{ year }}</span>
    </div>
    <p class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] mb-3">{{ role }}</p>
    <p class="text-[var(--text-muted)] mb-4">{{ summary }}</p>
    <div class="flex flex-wrap gap-1.5">
      <TagChip v-for="s in stack" :key="s">{{ s }}</TagChip>
    </div>
  </NuxtLink>
</template>
```

- [ ] **Step 2: Write `PostCard.vue`**

```vue
<script setup lang="ts">
const props = defineProps<{
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
}>();

const formatted = new Date(props.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
</script>

<template>
  <NuxtLink
    :to="`/writing/${slug}`"
    class="group block border-t border-[var(--line)] py-6 transition-colors hover:border-[var(--accent)]"
  >
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-2">{{ formatted }}</div>
    <h3 class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">{{ title }}</h3>
    <p class="text-[var(--text-muted)]">{{ excerpt }}</p>
  </NuxtLink>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add components/primitives/ProjectCard.vue components/primitives/PostCard.vue
git commit -m "feat(digitalseraph-vue): ProjectCard and PostCard primitives"
```

---

## Phase 5 — Layout chrome

### Task 18: `TheNavBar.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/layout/TheNavBar.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useThemeStore } from "~/stores/theme";

const theme = useThemeStore();
const emit = defineEmits<{ (e: "open-palette"): void }>();

const hidden = ref(false);
let lastY = 0;

function onScroll() {
  const y = window.scrollY;
  if (y > 80 && y > lastY) hidden.value = true;
  else hidden.value = false;
  lastY = y;
}

onMounted(() => {
  theme.init();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <nav
    :class="[
      'fixed top-0 inset-x-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--canvas)_85%,transparent)] backdrop-blur transition-transform duration-200',
      hidden ? '-translate-y-full' : 'translate-y-0',
    ]"
    aria-label="Primary"
  >
    <div class="max-w-[1280px] mx-auto px-8 h-12 flex items-center justify-between font-mono text-[var(--text-mono)]">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-[var(--accent)]">~/digitalseraph.com</span>
        <span class="text-[var(--text-dim)]">❯</span>
      </NuxtLink>
      <ul class="hidden md:flex items-center gap-5 text-[var(--text-muted)]">
        <li><NuxtLink to="/about" class="hover:text-[var(--accent)] transition-colors">about</NuxtLink></li>
        <li><NuxtLink to="/work" class="hover:text-[var(--accent)] transition-colors">work</NuxtLink></li>
        <li><NuxtLink to="/resume" class="hover:text-[var(--accent)] transition-colors">resume</NuxtLink></li>
        <li><NuxtLink to="/writing" class="hover:text-[var(--accent)] transition-colors">writing</NuxtLink></li>
        <li><NuxtLink to="/contact" class="hover:text-[var(--accent)] transition-colors">contact</NuxtLink></li>
      </ul>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          aria-label="Open command palette (⌘K)"
          @click="emit('open-palette')"
        >⌘K</button>
        <button
          type="button"
          class="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          :aria-label="`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} mode`"
          @click="theme.toggle()"
        >
          <span v-if="theme.mode === 'dark'">◐</span>
          <span v-else>◑</span>
        </button>
      </div>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/TheNavBar.vue
git commit -m "feat(digitalseraph-vue): TheNavBar with hide-on-scroll and theme toggle"
```

---

### Task 19: `TheCommandPalette.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/layout/TheCommandPalette.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const router = useRouter();
const query = ref("");
const selected = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

const routes = [
  { label: "home", path: "/" },
  { label: "about", path: "/about" },
  { label: "work", path: "/work" },
  { label: "resume", path: "/resume" },
  { label: "writing", path: "/writing" },
  { label: "contact", path: "/contact" },
];

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return routes;
  return routes.filter((r) => r.label.includes(q));
});

watch(
  () => props.open,
  async (v) => {
    if (v) {
      query.value = "";
      selected.value = 0;
      await nextTick();
      inputEl.value?.focus();
    }
  }
);

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
  if (e.key === "ArrowDown") { e.preventDefault(); selected.value = (selected.value + 1) % filtered.value.length; }
  if (e.key === "ArrowUp") { e.preventDefault(); selected.value = (selected.value - 1 + filtered.value.length) % filtered.value.length; }
  if (e.key === "Enter") {
    const pick = filtered.value[selected.value];
    if (pick) { router.push(pick.path); emit("close"); }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      @click.self="emit('close')"
      @keydown="onKey"
    >
      <div class="w-full max-w-xl mx-4 bg-[var(--canvas-raised)] border border-[var(--line)] rounded-lg shadow-2xl font-mono">
        <div class="px-4 py-3 border-b border-[var(--line)] flex items-center gap-2">
          <span class="text-[var(--accent)]">❯</span>
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            class="flex-1 bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-dim)]"
            placeholder="type to filter…"
            autocomplete="off"
          />
          <span class="text-[var(--text-dim)] text-xs">esc</span>
        </div>
        <ul class="max-h-80 overflow-y-auto p-2">
          <li
            v-for="(r, i) in filtered"
            :key="r.path"
            :class="[
              'px-3 py-2 rounded cursor-pointer',
              i === selected ? 'bg-[var(--line)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ]"
            @mouseenter="selected = i"
            @click="() => { $router.push(r.path); emit('close'); }"
          >
            <span class="text-[var(--text-dim)]">/ </span>{{ r.label }}
          </li>
          <li v-if="filtered.length === 0" class="px-3 py-2 text-[var(--text-dim)]">no matches</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/TheCommandPalette.vue
git commit -m "feat(digitalseraph-vue): TheCommandPalette with keyboard navigation"
```

---

### Task 20: `TheFooter.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/layout/TheFooter.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-[var(--line)] mt-32 py-10 text-center font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
    <div>— © {{ year }} david miller —</div>
    <div class="mt-2">
      <a href="https://github.com/digitalseraph" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--accent)] transition-colors">github</a>
      <span class="mx-2">·</span>
      <NuxtLink to="/contact" class="hover:text-[var(--accent)] transition-colors">contact</NuxtLink>
    </div>
  </footer>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/TheFooter.vue
git commit -m "feat(digitalseraph-vue): TheFooter"
```

---

### Task 21: `AppLayout.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/layout/AppLayout.vue`
- Modify: `web/digitalseraph-vue/app.vue`

- [ ] **Step 1: Write `AppLayout.vue`**

```vue
<script setup lang="ts">
import { ref } from "vue";
import TheNavBar from "./TheNavBar.vue";
import TheFooter from "./TheFooter.vue";
import TheCommandPalette from "./TheCommandPalette.vue";
import { useCommandKey } from "~/composables/useKeyboard";
import { useMotionStore } from "~/stores/motion";

const paletteOpen = ref(false);
useCommandKey(() => { paletteOpen.value = !paletteOpen.value; });

const motion = useMotionStore();
if (typeof window !== "undefined") motion.init();
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--canvas-raised)] focus:text-[var(--accent)] focus:px-3 focus:py-2 focus:rounded">
    skip to content
  </a>
  <TheNavBar @open-palette="paletteOpen = true" />
  <main id="main" class="pt-12">
    <slot />
  </main>
  <TheFooter />
  <TheCommandPalette :open="paletteOpen" @close="paletteOpen = false" />
</template>
```

- [ ] **Step 2: Rewrite `app.vue`**

```vue
<script setup lang="ts">
import AppLayout from "~/components/layout/AppLayout.vue";
</script>

<template>
  <AppLayout>
    <NuxtPage />
  </AppLayout>
</template>
```

- [ ] **Step 3: Verify**

```bash
pnpm dev
```
Expected: `/` renders with a nav bar, footer, main area. Pressing `Ctrl+K` (or `Cmd+K`) opens the palette. Theme toggle changes the data-theme attribute on `<html>` and re-colors the page.

- [ ] **Step 4: Commit**

```bash
git add components/layout/AppLayout.vue app.vue
git commit -m "feat(digitalseraph-vue): wire AppLayout with nav, footer, palette"
```

---

## Phase 6 — Content seed

### Task 22: Seed resume YAML, about markdown, work and writing entries

**Files:**
- Create: `web/digitalseraph-vue/content/about.md`
- Create: `web/digitalseraph-vue/content/resume.yml`
- Create: `web/digitalseraph-vue/content/work/01-project-one.md`
- Create: `web/digitalseraph-vue/content/work/02-project-two.md`
- Create: `web/digitalseraph-vue/content/work/03-project-three.md`
- Create: `web/digitalseraph-vue/content/writing/2026-03-12-first-post.md`
- Create: `web/digitalseraph-vue/content/writing/2026-02-04-second-post.md`

- [ ] **Step 1: Write `content/about.md`**

```markdown
---
title: About
summary: Engineer, builder, and occasional writer.
---

I build software with an unreasonable attention to craft. I've spent the better part of two decades writing code that ships to people, led teams of engineers through the long arcs of scaling, and kept a stubborn belief that interfaces can still feel like objects made by hand.

This site is a record — of the work I've shipped, of things I'm turning over in my head, and of the résumé of a career that keeps refusing to settle into one neat specialty.
```

- [ ] **Step 2: Write `content/resume.yml`**

```yaml
header:
  name: David Miller
  role: Engineer · Builder · Maker
  location: Remote
  email: hello@digitalseraph.com
experience:
  - role: Senior Software Engineer
    company: Placeholder Co
    start: 2023-01
    end: present
    domains: [leadership, systems]
    bullets:
      - Led migration from monolith to services across 40-engineer org
      - Drove observability platform adoption; pages reduced 60%
      - Mentored four engineers from mid to senior
  - role: Staff Engineer
    company: Studio Null
    start: 2020-03
    end: 2022-12
    domains: [leadership, frontend]
    bullets:
      - Shipped five product areas from zero to revenue
      - Authored team's design-system and contribution guide
  - role: Lead Engineer
    company: Lumen Labs
    start: 2018-06
    end: 2020-02
    domains: [systems, ml]
    bullets:
      - Built ingestion pipeline handling 3B events/day
      - First production deployment of in-house ML inference service
education:
  - school: University
    degree: B.S. Computer Science
    year: 2012
skills:
  - group: Languages
    items: [TypeScript, Rust, Go, Python, Elixir]
  - group: Platforms
    items: [AWS, Cloudflare, Kubernetes, Postgres, Redis]
  - group: Frontend
    items: [Vue, React, Tailwind, Motion]
principles:
  - Ship the thing. Then make it beautiful.
  - The cheapest system is the one you understand.
  - Earn the right to abstract.
contact:
  email: hello@digitalseraph.com
  github: digitalseraph
  linkedin: davidmiller
```

- [ ] **Step 3: Write work entries**

`content/work/01-project-one.md`:
```markdown
---
title: Project One
year: 2025
role: Lead Engineer
stack: [TypeScript, Rust, Cloudflare]
links:
  live: https://example.com
  repo: https://github.com/digitalseraph/example
cover: /og/project-one.svg
featured: true
summary: A small description of what this was, in one line.
---

Longer case study content goes here. Replace with real writing when ready.
```

`content/work/02-project-two.md`:
```markdown
---
title: Project Two
year: 2024
role: Staff Engineer
stack: [Vue, Tailwind, Postgres]
cover: /og/project-two.svg
featured: true
summary: Another placeholder project, one sentence long.
---

Body copy placeholder.
```

`content/work/03-project-three.md`:
```markdown
---
title: Project Three
year: 2023
role: Engineer
stack: [Go, Redis]
cover: /og/project-three.svg
featured: false
summary: A third placeholder.
---

Body copy placeholder.
```

- [ ] **Step 4: Write writing entries**

`content/writing/2026-03-12-first-post.md`:
```markdown
---
title: On craft and compromise
date: 2026-03-12
tags: [craft, process]
excerpt: A short meditation on when to polish and when to ship.
draft: false
---

Full post body placeholder.
```

`content/writing/2026-02-04-second-post.md`:
```markdown
---
title: Notes on systems I've broken
date: 2026-02-04
tags: [systems, postmortem]
excerpt: What I've learned from the ones that taught me the most.
draft: false
---

Full post body placeholder.
```

- [ ] **Step 5: Create placeholder OG covers**

Place three minimal SVG files at `public/og/project-one.svg`, `project-two.svg`, `project-three.svg`. Each is a 1200×630 SVG with the project title on a `#0a0a0a` background with a phosphor-green accent. Example (`project-one.svg`):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <text x="80" y="340" fill="#22c55e" font-family="JetBrains Mono, monospace" font-size="36">$ project-one</text>
  <text x="80" y="420" fill="#fafafa" font-family="Space Grotesk, sans-serif" font-size="96" font-weight="600" letter-spacing="-0.03em">Project One</text>
</svg>
```

- [ ] **Step 6: Commit**

```bash
git add content public/og
git commit -m "feat(digitalseraph-vue): seed placeholder content and OG covers"
```

---

## Phase 7 — Landing page sections

### Task 23: `HeroTerminal.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/landing/HeroTerminal.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import GridBackdrop from "~/components/primitives/GridBackdrop.vue";
import TerminalPrompt from "~/components/primitives/TerminalPrompt.vue";
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform: foregroundTransform } = useParallax({ speed: 1.2, reduced });
</script>

<template>
  <section class="relative min-h-[88vh] flex items-center overflow-hidden">
    <GridBackdrop :speed="0.1" />
    <div class="max-w-[1280px] mx-auto px-8 w-full relative z-10">
      <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-4 tracking-[0.2em] uppercase">
        ~/digitalseraph.com · online
      </div>
      <TerminalPrompt command="whoami" class="mb-4" />
      <h1 class="text-[clamp(2.5rem,8vw,4.5rem)] font-display font-semibold tracking-[-0.04em] leading-[0.95] text-[var(--text)]">
        david <span class="italic text-[var(--accent)]">miller</span>
      </h1>
      <div class="mt-6 font-mono text-[var(--text-mono)] text-[var(--text-muted)] tracking-[0.2em] uppercase" :style="{ transform: foregroundTransform }">
        Software · Systems · Shipping
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase">
      ↓ scroll
    </div>
  </section>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add components/landing/HeroTerminal.vue
git commit -m "feat(digitalseraph-vue): HeroTerminal landing section"
```

---

### Task 24: `AboutTeaser.vue`, `FeaturedWork.vue`, `WritingTeaser.vue`, `ContactCta.vue`

**Files:**
- Create: `web/digitalseraph-vue/components/landing/AboutTeaser.vue`
- Create: `web/digitalseraph-vue/components/landing/FeaturedWork.vue`
- Create: `web/digitalseraph-vue/components/landing/WritingTeaser.vue`
- Create: `web/digitalseraph-vue/components/landing/ContactCta.vue`

- [ ] **Step 1: Write `AboutTeaser.vue`**

```vue
<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-6 tracking-[0.2em] uppercase">$ cat about.md</div>
    <p class="text-[var(--text-body-l)] text-[var(--text)] max-w-2xl leading-relaxed">
      I build software with an unreasonable attention to craft. Two decades of shipping, leading, and keeping a stubborn belief that interfaces can still feel like objects made by hand.
    </p>
    <div class="mt-8">
      <NuxtLink to="/about" class="font-mono text-[var(--text-mono-l)] text-[var(--accent)] hover:underline underline-offset-4">
        read more →
      </NuxtLink>
    </div>
  </SectionReveal>
</template>
```

- [ ] **Step 2: Write `FeaturedWork.vue`**

```vue
<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import ProjectCard from "~/components/primitives/ProjectCard.vue";

const { data: projects } = await useAsyncData("featured-work", () =>
  queryCollection("work").where("featured", "=", true).order("year", "DESC").all()
);
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls work/ --featured</div>
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">selected work</h2>
      </div>
      <NuxtLink to="/work" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">view all →</NuxtLink>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="p in projects ?? []"
        :key="p.slug"
        :slug="p.slug"
        :title="p.title"
        :year="p.year"
        :role="p.role"
        :summary="p.summary"
        :stack="p.stack"
        :cover="p.cover"
      />
    </div>
  </SectionReveal>
</template>
```

Note: @nuxt/content v3 query API. If your installed version uses `queryContent(...)`, replace the query with the v2 equivalent:
```ts
queryContent("/work").where({ featured: true }).sort({ year: -1 }).find();
```

- [ ] **Step 3: Write `WritingTeaser.vue`**

```vue
<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import PostCard from "~/components/primitives/PostCard.vue";

const { data: posts } = await useAsyncData("writing-teaser", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").limit(3).all()
);
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls writing/</div>
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">recent writing</h2>
      </div>
      <NuxtLink to="/writing" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">all posts →</NuxtLink>
    </div>
    <div>
      <PostCard
        v-for="p in posts ?? []"
        :key="p.slug"
        :slug="p.slug"
        :title="p.title"
        :date="p.date"
        :excerpt="p.excerpt"
      />
    </div>
  </SectionReveal>
</template>
```

- [ ] **Step 4: Write `ContactCta.vue`**

```vue
<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import CopyInline from "~/components/primitives/CopyInline.vue";
import PillLink from "~/components/primitives/PillLink.vue";
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-40 text-center">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-6 tracking-[0.2em] uppercase">$ contact</div>
    <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">say hello</h2>
    <div class="font-mono text-[var(--text-mono-l)] mb-8">
      <CopyInline value="hello@digitalseraph.com" />
    </div>
    <div class="flex items-center justify-center gap-3">
      <PillLink href="https://github.com/digitalseraph" external>github</PillLink>
      <PillLink href="/contact">full contact page →</PillLink>
    </div>
  </SectionReveal>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add components/landing
git commit -m "feat(digitalseraph-vue): landing section components"
```

---

### Task 25: Wire landing page `pages/index.vue`

**Files:**
- Modify: `web/digitalseraph-vue/pages/index.vue`

- [ ] **Step 1: Write**

```vue
<script setup lang="ts">
import HeroTerminal from "~/components/landing/HeroTerminal.vue";
import AboutTeaser from "~/components/landing/AboutTeaser.vue";
import FeaturedWork from "~/components/landing/FeaturedWork.vue";
import WritingTeaser from "~/components/landing/WritingTeaser.vue";
import ContactCta from "~/components/landing/ContactCta.vue";

useHead({
  title: "David Miller — digitalseraph.com",
  meta: [{ name: "description", content: "Engineer, builder, and occasional writer. Selected work, writing, and contact." }],
});
</script>

<template>
  <HeroTerminal />
  <AboutTeaser />
  <FeaturedWork />
  <WritingTeaser />
  <ContactCta />
</template>
```

- [ ] **Step 2: Verify in browser**

```bash
pnpm dev
```
Open `http://localhost:3000`. Expected: hero renders with typing prompt + parallax grid; scroll reveals About → Featured Work (3 cards) → Writing (2 posts) → Contact. Nav hides on scroll down, returns on scroll up. `Ctrl+K` opens palette; arrow keys navigate; Enter routes.

- [ ] **Step 3: Commit**

```bash
git add pages/index.vue
git commit -m "feat(digitalseraph-vue): wire landing page"
```

---

## Phase 8 — Detail routes (stubs, real content later)

### Task 26: About, Contact, Work index, Writing index, Resume stub

**Files:**
- Create: `web/digitalseraph-vue/pages/about.vue`
- Create: `web/digitalseraph-vue/pages/contact.vue`
- Create: `web/digitalseraph-vue/pages/work/index.vue`
- Create: `web/digitalseraph-vue/pages/work/[slug].vue`
- Create: `web/digitalseraph-vue/pages/writing/index.vue`
- Create: `web/digitalseraph-vue/pages/writing/[slug].vue`
- Create: `web/digitalseraph-vue/pages/resume.vue`

- [ ] **Step 1: Write `pages/about.vue`**

```vue
<script setup lang="ts">
const { data: about } = await useAsyncData("about", () =>
  queryCollection("about").first()
);
useHead({ title: `About — digitalseraph` });
</script>

<template>
  <article class="max-w-2xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">about</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer v-if="about" :value="about" />
    </div>
  </article>
</template>
```

If @nuxt/content v2 syntax is in use:
```ts
const { data: about } = await useAsyncData("about", () => queryContent("/about").findOne());
```

- [ ] **Step 2: Write `pages/contact.vue`**

```vue
<script setup lang="ts">
import CopyInline from "~/components/primitives/CopyInline.vue";
import PillLink from "~/components/primitives/PillLink.vue";
useHead({ title: "Contact — digitalseraph" });
</script>

<template>
  <section class="max-w-xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">contact</h1>
    <p class="text-[var(--text-muted)] mb-8">The simplest way is email. If you prefer something else, pick a link below.</p>
    <div class="font-mono text-[var(--text-mono-l)] mb-10">
      <CopyInline value="hello@digitalseraph.com" />
    </div>
    <div class="flex flex-wrap gap-3">
      <PillLink href="https://github.com/digitalseraph" external>github</PillLink>
      <PillLink href="https://linkedin.com/in/davidmiller" external>linkedin</PillLink>
    </div>
  </section>
</template>
```

- [ ] **Step 3: Write `pages/work/index.vue`**

```vue
<script setup lang="ts">
import ProjectCard from "~/components/primitives/ProjectCard.vue";
const { data: projects } = await useAsyncData("all-work", () =>
  queryCollection("work").order("year", "DESC").all()
);
useHead({ title: "Work — digitalseraph" });
</script>

<template>
  <section class="max-w-[1280px] mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">work</h1>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="p in projects ?? []"
        :key="p.slug"
        :slug="p.slug"
        :title="p.title"
        :year="p.year"
        :role="p.role"
        :summary="p.summary"
        :stack="p.stack"
        :cover="p.cover"
      />
    </div>
  </section>
</template>
```

- [ ] **Step 4: Write `pages/work/[slug].vue`**

```vue
<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const { data: project } = await useAsyncData(`work-${slug}`, () =>
  queryCollection("work").where("slug", "=", slug).first()
);
useHead(() => ({ title: project.value ? `${project.value.title} — digitalseraph` : "digitalseraph" }));
</script>

<template>
  <article v-if="project" class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-3">{{ project.year }} · {{ project.role }}</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">{{ project.title }}</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="project" />
    </div>
  </article>
</template>
```

- [ ] **Step 5: Write `pages/writing/index.vue`**

```vue
<script setup lang="ts">
import PostCard from "~/components/primitives/PostCard.vue";
const { data: posts } = await useAsyncData("all-writing", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);
useHead({ title: "Writing — digitalseraph" });
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">writing</h1>
    <div>
      <PostCard
        v-for="p in posts ?? []"
        :key="p.slug"
        :slug="p.slug"
        :title="p.title"
        :date="p.date"
        :excerpt="p.excerpt"
      />
    </div>
  </section>
</template>
```

- [ ] **Step 6: Write `pages/writing/[slug].vue`**

```vue
<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("writing").where("slug", "=", slug).first()
);
useHead(() => ({ title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph" }));

const formatted = computed(() =>
  post.value ? new Date(post.value.date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : ""
);
</script>

<template>
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-3">{{ formatted }}</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">{{ post.title }}</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="post" />
    </div>
  </article>
</template>
```

- [ ] **Step 7: Write `pages/resume.vue` stub (full implementation in Plan 2)**

```vue
<script setup lang="ts">
useHead({ title: "Résumé — digitalseraph" });
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24 font-mono">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">résumé</h1>
    <div class="text-[var(--text-muted)]">
      <p class="mb-4">The interactive terminal résumé lands in Plan 2.</p>
      <p>Meanwhile, reach me at <a href="mailto:hello@digitalseraph.com" class="text-[var(--accent)] hover:underline">hello@digitalseraph.com</a>.</p>
    </div>
  </section>
</template>
```

- [ ] **Step 8: Verify all routes**

```bash
pnpm dev
```
Visit `/`, `/about`, `/work`, `/work/01-project-one`, `/writing`, `/writing/2026-03-12-first-post`, `/resume`, `/contact`. Expected: all render, no 404, no console errors.

- [ ] **Step 9: Commit**

```bash
git add pages
git commit -m "feat(digitalseraph-vue): about, contact, work, writing, resume routes"
```

---

### Task 27: Configure @nuxt/content collections

**Files:**
- Modify: `web/digitalseraph-vue/nuxt.config.ts`
- Create: `web/digitalseraph-vue/content.config.ts`

- [ ] **Step 1: Create `content.config.ts`** (required for @nuxt/content v3 typed collections)

```ts
import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    about: defineCollection({
      type: "page",
      source: "about.md",
    }),
    work: defineCollection({
      type: "page",
      source: "work/*.md",
      schema: z.object({
        title: z.string(),
        year: z.number(),
        role: z.string(),
        stack: z.array(z.string()),
        cover: z.string().optional(),
        featured: z.boolean().default(false),
        summary: z.string(),
        links: z.object({
          live: z.string().optional(),
          repo: z.string().optional(),
          writeup: z.string().optional(),
        }).optional(),
      }),
    }),
    writing: defineCollection({
      type: "page",
      source: "writing/*.md",
      schema: z.object({
        title: z.string(),
        date: z.string(),
        tags: z.array(z.string()).default([]),
        excerpt: z.string(),
        draft: z.boolean().default(false),
      }),
    }),
  },
});
```

If @nuxt/content v2 is installed instead (no `content.config.ts` support), skip this file — v2 auto-indexes. Adjust the queries in earlier tasks from `queryCollection(...)` to `queryContent(...)` accordingly (notes already added).

- [ ] **Step 2: Verify no query errors**

```bash
pnpm dev
```
Expected: work grid and writing list render with real data from `content/`.

- [ ] **Step 3: Commit**

```bash
git add content.config.ts
git commit -m "feat(digitalseraph-vue): @nuxt/content collection schemas"
```

---

## Phase 9 — Deployment

### Task 28: Wrangler config + deployment docs

**Files:**
- Create: `web/digitalseraph-vue/wrangler.toml`
- Create: `web/digitalseraph-vue/README.md`
- Create: `web/digitalseraph-vue/CLAUDE.md`

- [ ] **Step 1: Write `wrangler.toml`**

```toml
name = "digitalseraph"
compatibility_date = "2026-04-18"
pages_build_output_dir = ".output/public"

[vars]
SITE_URL = "https://digitalseraph.com"
```

- [ ] **Step 2: Write `README.md`**

```markdown
# digitalseraph-vue

Personal site for David Miller — digitalseraph.com.

## Stack

Nuxt (latest), Vue 3, TypeScript strict, Tailwind v4, Pinia, @nuxt/content, Motion.

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

## Deploy (Cloudflare Pages)

The production site deploys from `main` via the Cloudflare Pages integration.
To deploy from CLI:

```bash
pnpm generate
pnpm dlx wrangler pages deploy .output/public --project-name digitalseraph
```

## Content

- `content/about.md` — About page copy
- `content/resume.yml` — Résumé data (consumed by `/resume`)
- `content/work/*.md` — Project case studies
- `content/writing/*.md` — Blog posts

## Tests

```bash
pnpm test:unit   # vitest
pnpm test:e2e    # playwright (see tests/e2e)
```
```

- [ ] **Step 3: Write `CLAUDE.md`**

```markdown
# CLAUDE.md — digitalseraph-vue

## Commands

- `pnpm dev` — local dev server (http://localhost:3000)
- `pnpm generate` — static build to `.output/public`
- `pnpm test:unit` — vitest
- `pnpm test:e2e` — playwright

## Conventions

- Components live under `components/{layout,landing,primitives,resume,writing}/` — pick the closest subdirectory.
- Composables under `composables/` — prefix with `use*`, export named functions.
- Pinia stores under `stores/` — default export `use*Store` factories.
- All colors and type through CSS custom properties defined in `assets/css/tokens.css`. Never inline colors in components.
- All user-visible motion goes through `useParallax`, `useReveal`, or `useTyping` so `prefers-reduced-motion` is respected.
- Content is the source of truth for work/writing/about/resume. No hard-coded lists in components.

## When adding a new page

1. Add the route to `pages/`.
2. Register the route in `components/layout/TheCommandPalette.vue` `routes` array.
3. Update `TheNavBar` if it belongs in top-level nav.
```

- [ ] **Step 4: Verify static build**

```bash
pnpm generate
ls .output/public/
```
Expected: `index.html`, `about/index.html`, `work/index.html`, and all content routes exist. Open `.output/public/index.html` in a browser — page renders from static HTML.

- [ ] **Step 5: Commit**

```bash
git add wrangler.toml README.md CLAUDE.md
git commit -m "feat(digitalseraph-vue): deployment config and docs"
```

---

### Task 29: Cloudflare Pages connection (manual, one-time)

**Files:** none

- [ ] **Step 1: Push branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 2: Create Cloudflare Pages project (manual)**

In the Cloudflare dashboard:
1. Pages → Create project → Connect to Git → pick the `digitalseraph` repo.
2. Set build command: `cd web/digitalseraph-vue && pnpm install && pnpm generate`
3. Set build output directory: `web/digitalseraph-vue/.output/public`
4. Set root directory: repo root (Pages handles monorepo subpaths via the build command).
5. Framework preset: Nuxt (static).
6. Save and deploy.

Expected: preview URL loads the site; production URL loads after merging to `main`.

- [ ] **Step 3: Point custom domain**

In Cloudflare Pages → Custom domains → add `digitalseraph.com` and `www.digitalseraph.com`.

---

## Phase 10 — Basic smoke tests

### Task 30: Playwright config and smoke spec

**Files:**
- Create: `web/digitalseraph-vue/tests/e2e/playwright.config.ts`
- Create: `web/digitalseraph-vue/tests/e2e/smoke.spec.ts`
- Modify: `web/digitalseraph-vue/package.json`

- [ ] **Step 1: Install Playwright browser binaries**

```bash
pnpm dlx playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
```

- [ ] **Step 3: Write `smoke.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("homepage loads with hero and nav", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav").first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("miller");
});

test("nav routes to about", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "about", exact: true }).click();
  await expect(page).toHaveURL(/\/about/);
  await expect(page.getByRole("heading", { name: "about" })).toBeVisible();
});

test("command palette opens with ctrl+k and routes", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Control+K");
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
  await page.getByRole("textbox").fill("work");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/work/);
});

test("theme toggle flips data-theme and persists", async ({ page }) => {
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /switch to light mode/i }).click();
  await expect(html).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(html).toHaveAttribute("data-theme", "light");
});

test("writing index lists seeded posts", async ({ page }) => {
  await page.goto("/writing");
  await expect(page.getByRole("heading", { name: "writing" })).toBeVisible();
  await expect(page.getByText("On craft and compromise")).toBeVisible();
});

test("work detail page renders", async ({ page }) => {
  await page.goto("/work/01-project-one");
  await expect(page.getByRole("heading", { name: "Project One" })).toBeVisible();
});
```

- [ ] **Step 4: Add npm script**

Append to `package.json` `scripts`:
```json
"test:e2e": "playwright test --config tests/e2e/playwright.config.ts"
```

- [ ] **Step 5: Run tests — expect PASS**

```bash
pnpm test:e2e
```
Expected: 6 tests pass. If the palette test fails on macOS because of `Meta+K`, use `page.keyboard.press("Meta+K")` on macOS-only runs.

- [ ] **Step 6: Commit**

```bash
git add tests/e2e package.json pnpm-lock.yaml
git commit -m "feat(digitalseraph-vue): playwright smoke tests"
```

---

### Task 31: Final verification and PR

**Files:** none

- [ ] **Step 1: Run all tests**

```bash
pnpm test:unit
pnpm test:e2e
```
Expected: all green.

- [ ] **Step 2: Manual browser verification**

```bash
pnpm dev
```
Open Chrome DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload. Expected: no parallax, fades collapse to instant; typing prompt renders full text instantly.

Toggle theme both directions; reload; state persists. Resize window to 390px wide — layout stays readable, nav collapses sensibly (mobile menu reveal can ship later; v1 ok with just logo + actions visible).

- [ ] **Step 3: Build and preview static**

```bash
pnpm generate
pnpm dlx serve .output/public
```
Expected: every route renders from the static build.

- [ ] **Step 4: Push and open PR**

```bash
git push
gh pr create --title "digitalseraph-vue: foundation and landing end-to-end" --body "$(cat <<'EOF'
## Summary
- Scaffold the digitalseraph-vue Nuxt app in `web/digitalseraph-vue`
- Token-driven design system (phosphor green, Space Grotesk + JetBrains Mono)
- Motion composables: useParallax, useReveal, useTyping (all honor prefers-reduced-motion)
- Layout chrome: hide-on-scroll NavBar, Footer, ⌘K CommandPalette, theme toggle
- Landing page: HeroTerminal, About teaser, Featured work, Writing teaser, Contact CTA
- Detail routes for About, Work (index + [slug]), Writing (index + [slug]), Contact
- Résumé route stubbed — full terminal in Plan 2
- Wrangler config for Cloudflare Pages; build command and output path documented
- Vitest unit coverage for composables + stores; Playwright smoke E2E

## Test plan
- [ ] `pnpm test:unit` — all unit tests pass
- [ ] `pnpm test:e2e` — all smoke tests pass
- [ ] `pnpm generate` produces static output
- [ ] Deploy preview on Cloudflare Pages renders every route
- [ ] Manual: reduced-motion mode collapses all animation; theme toggle persists; ⌘K palette navigates

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

---

## Self-review notes (completed by author)

- **Spec coverage:** every section of `2026-04-18-digitalseraph-vue-design.md` addressed except the resume terminal sub-system, writing prose pipeline (Shiki theme + long-form typography), and the Lighthouse CI check — those are explicitly deferred to Plans 2, 3, and 4.
- **Placeholders:** none in the plan itself; placeholder *content* in `content/*.md` and `resume.yml` is intentional and called out in the spec.
- **Type consistency:** composable signatures (`useParallax({ speed, reduced? })`, `useReveal(target, opts?)`, `useTyping({ text, speed?, reduced? })`) are consistent across tests and usages.
- **Scope:** Plan is self-contained — lands a working, deployed, navigable site with placeholder content. Follow-up plans don't block this one from merging.
