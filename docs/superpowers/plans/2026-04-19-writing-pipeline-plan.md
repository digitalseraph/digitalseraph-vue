# Writing Pipeline Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take `/writing/[slug]` from bare `ContentRenderer + prose prose-invert` to a polished reading experience with custom phosphor-green Shiki syntax highlighting, a structured post meta header, a token-aligned prose theme, and chronological previous/next navigation.

**Architecture:** Pure utilities for reading-time + sibling resolution (TDD). A custom VS Code-format Shiki theme committed as a JSON asset. A `prose.css` that overrides @tailwindcss/typography's CSS variables to pull from the site's existing design tokens. Three small presentation components (PostMetaHeader, PostMetaTags, PostNav). The `/writing/[slug]` page composes all of them.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript strict, @nuxt/content v3.13 with Shiki, `@tailwindcss/typography` (already installed in Plan 1 polish), existing Plan 1 design tokens and `TagChip` primitive.

**Spec reference:** `docs/superpowers/specs/2026-04-19-writing-pipeline-design.md`

---

## File Structure (produced by this plan)

```
app/
├── assets/
│   ├── css/
│   │   └── prose.css                               # new
│   └── shiki/
│       └── digitalseraph-dark.json                 # new
├── components/
│   └── writing/
│       ├── PostMetaHeader.vue                      # new
│       ├── PostMetaTags.vue                        # new
│       └── PostNav.vue                             # new
├── types/
│   └── postNav.ts                                  # new: PostRef interface
├── utils/
│   ├── readingTime.ts                              # new
│   └── postNav.ts                                  # new
└── pages/
    └── writing/[slug].vue                          # modified
app/assets/css/main.css                             # modified (import prose.css)
nuxt.config.ts                                      # modified (Shiki config)
tests/
├── unit/
│   ├── readingTime.test.ts                         # new, 4 cases
│   └── postNav.test.ts                             # new, 5 cases
└── e2e/
    └── smoke.spec.ts                               # modified: 1 new test
```

---

## Phase 0 — Pure utilities (TDD)

### Task 1: `PostRef` type

**Files:**
- Create: `app/types/postNav.ts`

- [ ] **Step 1: Write the file**

```ts
// app/types/postNav.ts

export interface PostRef {
  slug: string;
  title: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/types/postNav.ts
git commit -m "feat(writing): add PostRef type for post navigation"
```

---

### Task 2: `readingTime.ts` with tests

**Files:**
- Create: `app/utils/readingTime.ts`
- Test: `tests/unit/readingTime.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/readingTime.test.ts
import { describe, it, expect } from "vitest";
import { readingMinutes } from "~/utils/readingTime";

describe("readingMinutes", () => {
  it("returns 1 for an empty string (minimum floor)", () => {
    expect(readingMinutes("")).toBe(1);
  });

  it("returns 1 for 220 words (exactly one minute at 220 wpm)", () => {
    const text = Array(220).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(1);
  });

  it("returns 2 for 440 words", () => {
    const text = Array(440).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(2);
  });

  it("returns 10 for 2200 words", () => {
    const text = Array(2200).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(10);
  });

  it("returns 1 when input is whitespace-only", () => {
    expect(readingMinutes("   \n\t   ")).toBe(1);
  });

  it("returns 1 when input is null/undefined (defensive)", () => {
    expect(readingMinutes(null as any)).toBe(1);
    expect(readingMinutes(undefined as any)).toBe(1);
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test:unit`
Expected: FAIL with import unresolved.

- [ ] **Step 3: Implement**

```ts
// app/utils/readingTime.ts

/**
 * Estimate reading time in minutes for a markdown or plain-text string.
 * Uses 220 words per minute (a reasonable average for moderately technical
 * reading). Minimum floor of 1 minute so zero-word inputs don't render
 * "0 min read".
 */
export function readingMinutes(text: string): number {
  if (!text) return 1;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm test:unit`
Expected: 6 new readingMinutes tests pass. Total: 27 (from Plan 2) + 6 = **33**.

- [ ] **Step 5: Commit**

```bash
git add app/utils/readingTime.ts tests/unit/readingTime.test.ts
git commit -m "feat(writing): readingMinutes utility with tests"
```

---

### Task 3: `postNav.ts` `getPostSiblings` with tests

**Files:**
- Create: `app/utils/postNav.ts`
- Test: `tests/unit/postNav.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/postNav.test.ts
import { describe, it, expect } from "vitest";
import { getPostSiblings } from "~/utils/postNav";

const posts = [
  { stem: "writing/2026-04-10-third", title: "Third post", date: "2026-04-10" },
  { stem: "writing/2026-03-12-second", title: "Second post", date: "2026-03-12" },
  { stem: "writing/2026-02-04-first", title: "First post", date: "2026-02-04" },
];

describe("getPostSiblings", () => {
  it("finds prev and next when current is in the middle", () => {
    const result = getPostSiblings(posts, "writing/2026-03-12-second");
    expect(result.prev).toEqual({ slug: "2026-02-04-first", title: "First post" });
    expect(result.next).toEqual({ slug: "2026-04-10-third", title: "Third post" });
  });

  it("returns null prev for the oldest post (no older)", () => {
    const result = getPostSiblings(posts, "writing/2026-02-04-first");
    expect(result.prev).toBeNull();
    expect(result.next).toEqual({ slug: "2026-03-12-second", title: "Second post" });
  });

  it("returns null next for the newest post (no newer)", () => {
    const result = getPostSiblings(posts, "writing/2026-04-10-third");
    expect(result.prev).toEqual({ slug: "2026-03-12-second", title: "Second post" });
    expect(result.next).toBeNull();
  });

  it("returns both null when current stem is not in the list", () => {
    const result = getPostSiblings(posts, "writing/2026-05-01-ghost");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("returns both null for a single-post array", () => {
    const single = [{ stem: "writing/only", title: "Only post", date: "2026-01-01" }];
    const result = getPostSiblings(single, "writing/only");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("derives slug by dropping the directory prefix", () => {
    const result = getPostSiblings(posts, "writing/2026-03-12-second");
    expect(result.prev?.slug).toBe("2026-02-04-first");
    expect(result.next?.slug).toBe("2026-04-10-third");
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test:unit`
Expected: FAIL, import unresolved.

- [ ] **Step 3: Implement**

```ts
// app/utils/postNav.ts
import type { PostRef } from "~/types/postNav";

interface PostLike {
  stem: string;
  title: string;
  date: string;
}

/**
 * Given a list of posts and the current post's stem, return the chronologically
 * previous and next post references. "Previous" = older; "Next" = newer.
 *
 * Posts are internally sorted by date descending (newest first); the previous
 * sibling is at index+1 and next sibling is at index-1 in that sort.
 *
 * Returns `{ prev: null, next: null }` when the current stem isn't in the list
 * or when there's only one post.
 */
export function getPostSiblings(
  all: PostLike[],
  currentStem: string
): { prev: PostRef | null; next: PostRef | null } {
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const i = sorted.findIndex((p) => p.stem === currentStem);
  if (i === -1) return { prev: null, next: null };

  const makeRef = (p?: PostLike): PostRef | null =>
    p ? { slug: p.stem.split("/").pop() ?? "", title: p.title } : null;

  return {
    prev: makeRef(sorted[i + 1]),
    next: makeRef(sorted[i - 1]),
  };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm test:unit`
Expected: 6 new `getPostSiblings` tests pass. Total: 33 + 6 = **39**.

- [ ] **Step 5: Commit**

```bash
git add app/utils/postNav.ts tests/unit/postNav.test.ts
git commit -m "feat(writing): getPostSiblings helper with tests"
```

---

## Phase 1 — Shiki theme + @nuxt/content config

### Task 4: Custom Shiki theme JSON

**Files:**
- Create: `app/assets/shiki/digitalseraph-dark.json`

- [ ] **Step 1: Write the theme file**

```json
{
  "name": "digitalseraph-dark",
  "type": "dark",
  "colors": {
    "editor.background": "#0a0a0a",
    "editor.foreground": "#e5e5e5"
  },
  "tokenColors": [
    {
      "scope": ["comment", "punctuation.definition.comment"],
      "settings": { "foreground": "#525252", "fontStyle": "italic" }
    },
    {
      "scope": [
        "keyword",
        "storage",
        "storage.type",
        "storage.modifier",
        "keyword.control",
        "keyword.operator.new",
        "keyword.operator.expression",
        "keyword.other"
      ],
      "settings": { "foreground": "#22c55e" }
    },
    {
      "scope": ["string", "string.quoted", "string.template"],
      "settings": { "foreground": "#fde68a" }
    },
    {
      "scope": ["entity.name.type", "support.type", "support.class", "entity.other.inherited-class"],
      "settings": { "foreground": "#a3a3a3" }
    },
    {
      "scope": ["constant.numeric", "constant.language", "constant.other"],
      "settings": { "foreground": "#fbbf24" }
    },
    {
      "scope": [
        "entity.name.function",
        "support.function",
        "meta.function-call entity.name.function"
      ],
      "settings": { "foreground": "#e5e5e5" }
    },
    {
      "scope": ["punctuation", "meta.brace", "meta.delimiter"],
      "settings": { "foreground": "#737373" }
    },
    {
      "scope": [
        "variable",
        "variable.other",
        "meta.object-literal.key",
        "entity.other.attribute-name"
      ],
      "settings": { "foreground": "#e5e5e5" }
    },
    {
      "scope": ["invalid", "invalid.illegal"],
      "settings": { "foreground": "#fb7185" }
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add app/assets/shiki/digitalseraph-dark.json
git commit -m "feat(writing): custom phosphor-green Shiki theme"
```

---

### Task 5: Wire Shiki into nuxt.config.ts

**Files:**
- Modify: `nuxt.config.ts`

- [ ] **Step 1: Read current config**

Read `nuxt.config.ts` so you know the current `content:` block shape (after the polish-pass changes):

```ts
  content: {
    highlight: false,
    // Node 22+ has a built-in sqlite module; use it so @nuxt/content
    // does not require the optional better-sqlite3 native dep.
    experimental: { sqliteConnector: "native" },
  },
```

- [ ] **Step 2: Replace with Shiki-enabled config**

Replace the `content:` block with:

```ts
  content: {
    experimental: { sqliteConnector: "native" },
    build: {
      markdown: {
        highlight: {
          theme: "digitalseraph-dark",
          langs: [
            "ts",
            "js",
            "vue",
            "bash",
            "shell",
            "css",
            "html",
            "json",
            "yaml",
            "md",
            "diff",
          ],
        },
      },
    },
  },
```

- [ ] **Step 3: Register the custom theme**

@nuxt/content 3.13 accepts theme names bundled with Shiki OR inline theme objects. Since `"digitalseraph-dark"` isn't a bundled name, pass the theme as an imported JSON object instead.

Update the `content:` block:

```ts
import digitalseraphDark from "./app/assets/shiki/digitalseraph-dark.json";

export default defineNuxtConfig({
  // ...
  content: {
    experimental: { sqliteConnector: "native" },
    build: {
      markdown: {
        highlight: {
          theme: digitalseraphDark as any,
          langs: [
            "ts",
            "js",
            "vue",
            "bash",
            "shell",
            "css",
            "html",
            "json",
            "yaml",
            "md",
            "diff",
          ],
        },
      },
    },
  },
});
```

Add the import at the top of `nuxt.config.ts` alongside the existing `import tailwindcss from "@tailwindcss/vite";`.

The `as any` cast is pragmatic — Shiki accepts VS Code-format theme objects at runtime, but its type signature expects a specific `ThemeInput` shape. If TypeScript still complains at build, alternative spellings to try:

- `theme: digitalseraphDark as unknown as any`
- Importing the JSON with `import digitalseraphDark from "./app/assets/shiki/digitalseraph-dark.json" assert { type: "json" };`
- Writing the theme as a `.ts` file with a typed export instead of JSON

If none of the above works cleanly, report and we'll adjust.

- [ ] **Step 4: Verify**

Run: `pnpm dev` (background, curl `/` → HTTP 200, kill).

Expected: No Shiki parse errors in the log. `[@nuxt/content]` still processes collections.

Then temporarily edit one of the seeded posts (`content/writing/2026-03-12-first-post.md`) to include a fenced code block:

```
\`\`\`ts
const x = 1;
\`\`\`
```

Restart `pnpm dev`, curl `/writing/2026-03-12-first-post`, and grep the HTML for `style="color:#22c55e"` (or `#22C55E`) — if the keyword `const` is styled with the accent color, the custom theme is rendering. Revert the post edit.

- [ ] **Step 5: Commit**

```bash
git add nuxt.config.ts
git commit -m "feat(writing): enable Shiki syntax highlighting with custom theme"
```

---

## Phase 2 — Prose theme

### Task 6: `prose.css` + import

**Files:**
- Create: `app/assets/css/prose.css`
- Modify: `app/assets/css/main.css`

- [ ] **Step 1: Write `app/assets/css/prose.css`**

```css
/* Token-driven overrides for @tailwindcss/typography.
   Keeps all prose colors on the site's design-token system so the
   light theme (when enabled) works for free. */

@layer utilities {
  .prose {
    --tw-prose-body:         var(--text-muted);
    --tw-prose-headings:     var(--text);
    --tw-prose-lead:         var(--text);
    --tw-prose-links:        var(--accent);
    --tw-prose-bold:         var(--text);
    --tw-prose-counters:     var(--text-dim);
    --tw-prose-bullets:      var(--text-dim);
    --tw-prose-hr:           var(--line);
    --tw-prose-quotes:       var(--text);
    --tw-prose-quote-borders: var(--accent);
    --tw-prose-captions:     var(--text-dim);
    --tw-prose-code:         var(--text);
    --tw-prose-pre-code:     var(--text);
    --tw-prose-pre-bg:       transparent;
    --tw-prose-th-borders:   var(--line);
    --tw-prose-td-borders:   var(--line);
  }
}

/* Links: 1px underline, accent color at 60% opacity, solidifies on hover */
.prose a {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
  text-decoration-color: color-mix(in oklab, var(--accent) 60%, transparent);
  transition: text-decoration-color 120ms ease;
}
.prose a:hover {
  text-decoration-color: var(--accent);
}

/* Inline code: mono, subtle bg, 1px border, kills Tailwind's default backticks */
.prose :not(pre) > code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--canvas-raised);
  color: var(--text);
  padding: 1px 5px;
  border: 1px solid var(--line);
  border-radius: 3px;
}
.prose :not(pre) > code::before,
.prose :not(pre) > code::after {
  content: none;
}

/* Code block wrapper */
.prose pre {
  background: #0a0a0a;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 18px 20px;
  position: relative;
  overflow-x: auto;
}
.prose pre::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent,
    color-mix(in oklab, var(--accent) 70%, transparent),
    transparent
  );
  pointer-events: none;
}

/* Blockquote — accent left border + italic */
.prose blockquote {
  border-left-color: var(--accent);
  font-style: italic;
  color: var(--text-muted);
}
```

- [ ] **Step 2: Update `app/assets/css/main.css`**

Read the current file, then add the prose import after `tokens.css`. The file should end up looking like:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@import "./tokens.css";
@import "./prose.css";

/* ...existing rules stay... */
```

Preserve every existing rule below the imports.

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit `/writing/2026-03-12-first-post`. Expected: the body paragraph renders in `var(--text-muted)` color (`#a3a3a3` in dark theme), links have the thin accent underline, no compile errors. Kill server.

- [ ] **Step 4: Commit**

```bash
git add app/assets/css/prose.css app/assets/css/main.css
git commit -m "feat(writing): prose theme aligned to site tokens"
```

---

## Phase 3 — Writing components

### Task 7: `PostMetaHeader.vue`

**Files:**
- Create: `app/components/writing/PostMetaHeader.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    date: string;
    readingMinutes: number;
    kicker?: string;
  }>(),
  { kicker: "$ writing/" }
);

const formatted = computed(() =>
  new Date(props.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
);
</script>

<template>
  <div>
    <div
      class="font-mono text-[var(--text-mono)] text-[var(--accent)] uppercase tracking-[0.15em] mb-2"
    >
      {{ kicker }}
    </div>
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
      {{ formatted }}
      <span class="mx-2">·</span>
      {{ readingMinutes }} min read
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/writing/PostMetaHeader.vue
git commit -m "feat(writing): PostMetaHeader (kicker + date + reading time)"
```

---

### Task 8: `PostMetaTags.vue`

**Files:**
- Create: `app/components/writing/PostMetaTags.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import TagChip from "~/components/primitives/TagChip.vue";

defineProps<{ tags: string[] }>();
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1.5">
    <TagChip v-for="tag in tags" :key="tag">{{ tag }}</TagChip>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/writing/PostMetaTags.vue
git commit -m "feat(writing): PostMetaTags chip list"
```

---

### Task 9: `PostNav.vue`

**Files:**
- Create: `app/components/writing/PostNav.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import type { PostRef } from "~/types/postNav";

defineProps<{
  prev?: PostRef | null;
  next?: PostRef | null;
}>();
</script>

<template>
  <nav
    v-if="prev || next"
    aria-label="Post navigation"
    class="pt-6 border-t border-[var(--line)] flex items-center justify-between gap-6 font-mono text-[var(--text-mono)]"
  >
    <NuxtLink
      v-if="prev"
      :to="`/writing/${prev.slug}`"
      class="group min-w-0 max-w-[48%] truncate text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
    >
      <span class="text-[var(--text-dim)]">← previous ·</span>
      <span class="ml-1">{{ prev.title }}</span>
    </NuxtLink>
    <span v-else class="flex-1"></span>

    <NuxtLink
      v-if="next"
      :to="`/writing/${next.slug}`"
      class="group min-w-0 max-w-[48%] truncate text-right text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
    >
      <span>{{ next.title }}</span>
      <span class="text-[var(--text-dim)] ml-1">· next →</span>
    </NuxtLink>
    <span v-else class="flex-1"></span>
  </nav>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/writing/PostNav.vue
git commit -m "feat(writing): PostNav inline previous/next row"
```

---

## Phase 4 — Page wiring

### Task 10: Rewrite `/writing/[slug].vue`

**Files:**
- Modify: `app/pages/writing/[slug].vue`

- [ ] **Step 1: Read the current file**

Confirm the pre-existing implementation (from Plan 1). It should look roughly like:

```vue
<script setup lang="ts">
import { computed } from "vue";
const route = useRoute();
const slug = route.params.slug as string;
const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("writing").where("stem", "=", `writing/${slug}`).first()
);
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}
useHead(() => ({ title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph" }));

const formatted = computed(() => ...);
</script>

<template>
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono ...">{{ formatted }}</div>
    <h1 class="...">{{ post.title }}</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="post" />
    </div>
  </article>
</template>
```

- [ ] **Step 2: Replace the entire file with the new composed version**

```vue
<script setup lang="ts">
import { computed } from "vue";
import PostMetaHeader from "~/components/writing/PostMetaHeader.vue";
import PostMetaTags from "~/components/writing/PostMetaTags.vue";
import PostNav from "~/components/writing/PostNav.vue";
import { readingMinutes } from "~/utils/readingTime";
import { getPostSiblings } from "~/utils/postNav";

const route = useRoute();
const slug = route.params.slug as string;

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("writing").where("stem", "=", `writing/${slug}`).first()
);
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}

const { data: allPosts } = await useAsyncData("all-writing-for-nav", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

const siblings = computed(() =>
  getPostSiblings(allPosts.value ?? [], `writing/${slug}`)
);

// Estimate reading time from the parsed body. @nuxt/content stores the
// body as an AST; JSON.stringify then whitespace-split gives a rough
// word count that's close enough for a "min read" estimate. If the
// result is clearly wrong once real posts exist, swap for an AST walker.
const reading = computed(() => {
  const bodyText = post.value?.body ? JSON.stringify(post.value.body) : "";
  return readingMinutes(bodyText);
});

useHead(() => ({
  title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph",
}));
</script>

<template>
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <PostMetaHeader :date="post.date" :reading-minutes="reading" />

    <h1
      class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-4 mt-2"
    >
      {{ post.title }}
    </h1>

    <PostMetaTags :tags="post.tags ?? []" class="mb-10" />

    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="post" />
    </div>

    <PostNav class="mt-16" :prev="siblings.prev" :next="siblings.next" />
  </article>
</template>
```

- [ ] **Step 3: Verify**

Run `pnpm dev`. Visit `/writing/2026-03-12-first-post`. Expected:
- Green `$ writing/` kicker at the top
- Date + "1 min read" under it
- Title (h1)
- No tag chips (seeded post has tags `[craft, process]` — if those render, success)
- Prose body with accent-underlined links
- Bottom nav: "previous · Notes on systems I've broken" on the left (since this is the newer of the 2 seeded posts). No "next →" (this is the newest).

Visit `/writing/2026-02-04-second-post`. Expected: `next →` link to "On craft and compromise", no "previous".

Kill server.

- [ ] **Step 4: Commit**

```bash
git add app/pages/writing/[slug].vue
git commit -m "feat(writing): compose PostMeta + PostNav on /writing/[slug]"
```

---

## Phase 5 — E2E test

### Task 11: Extend `smoke.spec.ts`

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Read the current file**

Confirm the pre-existing 6 tests are intact. You'll append one new test to the same describe block (or add at end of file).

- [ ] **Step 2: Append the new test**

At the end of `tests/e2e/smoke.spec.ts`, before the final closing brace, append:

```ts
test("writing post renders meta, prose, and nav", async ({ page }) => {
  await page.goto("/writing/2026-03-12-first-post");

  // Accent kicker
  await expect(page.getByText("$ writing/")).toBeVisible();

  // Date + reading time line
  await expect(page.getByText(/min read/)).toBeVisible();

  // Title
  await expect(
    page.getByRole("heading", { level: 1, name: /On craft/i })
  ).toBeVisible();

  // Prose container (from @tailwindcss/typography + our overrides)
  await expect(page.locator("article .prose")).toBeVisible();

  // Post nav — this is the newer of 2 seeded posts, so only "← previous" shows
  await expect(page.getByText(/← previous/)).toBeVisible();
});
```

- [ ] **Step 3: Run E2E**

```bash
pnpm test:e2e tests/e2e/smoke.spec.ts
```

Expected: 7 tests pass (6 pre-existing + 1 new).

Then run full E2E:
```bash
pnpm test:e2e
```
Expected: 14 total pass (7 smoke + 7 resume).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/smoke.spec.ts
git commit -m "test(writing): smoke test for post meta + prose + nav"
```

---

## Final verification

After all 11 tasks commit:

- [ ] `pnpm test:unit` — **39 tests** pass (27 Plan-2 + 6 readingTime + 6 postNav)
- [ ] `pnpm test:e2e` — **14 tests** pass (7 smoke + 7 resume)
- [ ] `pnpm generate` — succeeds; `.output/public/writing/2026-03-12-first-post/index.html` exists and contains the `$ writing/` kicker
- [ ] Dev-server log: no Shiki errors, no CSS errors
- [ ] Manual: visit `/writing/2026-03-12-first-post` in browser; scroll to bottom; confirm the prev-only link renders correctly on desktop; resize to 390px — nav row stays readable

---

## Self-review notes

- **Spec coverage:** every spec section maps to a task:
  - §2 Shiki → Tasks 4, 5
  - §3 PostMeta → Tasks 7, 8
  - §4 Prose → Task 6
  - §5 PostNav → Tasks 1, 3, 9
  - §6 Page wiring → Task 10
  - §8 Testing → Tasks 2, 3, 11
- **No placeholders:** every code block is complete; every verification step has an exact command and expected output.
- **Type consistency:** `PostRef` defined in Task 1 is imported in Tasks 3 and 9. `getPostSiblings` signature matches Task 10's usage. `readingMinutes` signature matches Task 10's usage. Component prop names (`date`, `readingMinutes`, `tags`, `prev`, `next`) are consistent between component definitions and page consumption.
- **Open items deferred to implementation per the spec:** exact @nuxt/content Shiki config path if it differs from the assumed `content.build.markdown.highlight`; reading-time approach (JSON.stringify fallback is good enough to start).
