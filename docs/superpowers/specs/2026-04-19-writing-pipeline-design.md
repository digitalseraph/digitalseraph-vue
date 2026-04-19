# Writing pipeline polish — design spec

**Date:** 2026-04-19
**Project:** `digitalseraph-vue` (repo `digitalseraph/digitalseraph-vue`)
**Routes touched:** `/writing/[slug]`
**Status:** Design approved, pending implementation plan
**Supersedes:** the original design spec's §3 prose typography note ("Long-form prose font in Writing: stick with Space Grotesk or introduce a system serif for reading. Decide when we have real post content in front of us.") — decision: stick with Space Grotesk.

---

## 1. Overview

Take the `/writing/[slug]` route from its bare "`ContentRenderer` inside `prose prose-invert`" state to a polished reading experience: a custom phosphor-green Shiki syntax theme for code blocks, a `PostMeta` header component (accent-kicker + date + reading time + tag chips), a custom prose theme that pulls the site's design tokens through `@tailwindcss/typography`, and a `PostNav` component linking to the previous and next published posts in reverse-chronological order.

**Goals**

- Make code blocks render with the site's phosphor-green identity, not Shiki's built-in rainbow themes
- Give every post a consistent, scannable metadata header that reinforces the terminal aesthetic
- Pull all prose colors through the existing CSS-var token system (no hardcoded palette values in prose)
- Offer chronological navigation between posts
- No new font families — stay on Space Grotesk + JetBrains Mono

**Non-goals (v1)**

- Tag filtering or per-tag index pages
- RSS feed
- Table of contents
- Reading progress indicator
- Code-block copy-to-clipboard button
- Post comments, reactions, or webmentions

---

## 2. Shiki configuration and custom theme

### 2.1 Enable highlighting

`nuxt.config.ts` currently has `content: { highlight: false, ... }`. Replace with:

```ts
content: {
  sqliteConnector: "native",  // preserve existing (post-polish-pass config)
  build: {
    markdown: {
      highlight: {
        theme: "digitalseraph-dark",
        langs: ["ts", "js", "vue", "bash", "shell", "css", "html", "json", "yaml", "md", "diff"],
      },
    },
  },
},
```

(Exact key path per @nuxt/content v3.13 — verify during implementation. If the structure differs, adjust; intent is: use a custom theme + whitelisted languages.)

### 2.2 Custom theme file

`app/assets/shiki/digitalseraph-dark.json` — a VS Code-format theme with the site's phosphor-green palette:

```json
{
  "name": "digitalseraph-dark",
  "type": "dark",
  "colors": {
    "editor.background": "#0a0a0a",
    "editor.foreground": "#e5e5e5"
  },
  "tokenColors": [
    { "scope": ["comment", "punctuation.definition.comment"], "settings": { "foreground": "#525252", "fontStyle": "italic" } },
    { "scope": ["keyword", "storage", "storage.type", "storage.modifier", "keyword.control", "keyword.operator.new", "keyword.operator.expression", "keyword.other"], "settings": { "foreground": "#22c55e" } },
    { "scope": ["string", "string.quoted"], "settings": { "foreground": "#fde68a" } },
    { "scope": ["entity.name.type", "support.type", "support.class"], "settings": { "foreground": "#a3a3a3" } },
    { "scope": ["constant.numeric", "constant.language", "constant.other"], "settings": { "foreground": "#fbbf24" } },
    { "scope": ["entity.name.function", "support.function", "meta.function-call entity.name.function"], "settings": { "foreground": "#e5e5e5" } },
    { "scope": ["punctuation", "meta.brace", "meta.delimiter"], "settings": { "foreground": "#737373" } },
    { "scope": ["variable", "variable.other", "meta.object-literal.key", "entity.other.attribute-name"], "settings": { "foreground": "#e5e5e5" } },
    { "scope": ["invalid", "invalid.illegal"], "settings": { "foreground": "#fb7185" } }
  ]
}
```

The theme ships as a static JSON asset imported by @nuxt/content's Shiki integration. No runtime compilation — Shiki consumes VS Code themes directly.

### 2.3 Code block chrome

Styled via `app/assets/css/prose.css` (see §4):

- `pre` wrapper: `border: 1px solid var(--line)`, `border-radius: 6px`, `padding: 18px 20px`, background locked to `#0a0a0a` so the theme's editor-background is respected
- A 1-pixel top accent bar: `linear-gradient(90deg, transparent, var(--accent-glow), transparent)` positioned absolutely at `top: 0` — marks code blocks as distinct "content zones" without heavy borders
- Horizontal overflow scrolls, no wrap

### 2.4 Inline code

Single-backtick inline code gets its own styling (§4 `prose.css`): monospace font, subtle `var(--canvas-raised)` background, 1px border in `var(--line)`, 3px radius, 1px horizontal padding, same text color as body. The default Tailwind Typography backticks (`::before`/`::after` pseudo-elements) are suppressed.

---

## 3. `PostMeta.vue`

New component at `app/components/writing/PostMeta.vue`.

### 3.1 Props

```ts
defineProps<{
  date: string;             // ISO "YYYY-MM-DD"
  readingMinutes: number;   // integer ≥ 1
  tags: string[];
  kicker?: string;          // defaults to "$ writing/"
}>();
```

### 3.2 Rendered structure

```
$ writing/                           ← kicker, phosphor green, uppercase, 0.15em tracking
Apr 12, 2026 · 4 min read            ← meta, mono, text-dim
<h1>Post title</h1>                  ← rendered OUTSIDE PostMeta
craft · process                      ← tag chips (reusing TagChip primitive)
```

Component renders the kicker, meta line, and tag chips. The post title is rendered by `/writing/[slug].vue` between the meta line and the tag chips (so the title sits in the visual tension between the two metadata rows).

Reorder consideration: `PostMeta` will expose two named slots so the page controls title placement cleanly:
- `#before-title` — kicker + meta (renders above the slot)
- `#after-title` — tag chips (renders below the slot)

Simpler alternative: `PostMeta` is split into two tiny components — `PostMetaHeader` (kicker + meta, used ABOVE the `<h1>`) and `PostMetaTags` (chips, used BELOW the `<h1>`). This is clearer than the slot approach.

**Pick the two-component form.** Single-responsibility-per-file, matches project convention.

Files:
- `app/components/writing/PostMetaHeader.vue` — kicker + meta
- `app/components/writing/PostMetaTags.vue` — tag chips

### 3.3 Date and reading-time formatting

- Date: same `"en-US"` locale as the rest of the site — `"Apr 12, 2026"`. Inline `new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })` — two call sites max (PostMetaHeader and existing PostCard), cheap to duplicate for now. If a third consumer appears, extract to `app/utils/dateFormat.ts`.
- Reading minutes: pure helper at `app/utils/readingTime.ts`:

```ts
export function readingMinutes(markdown: string): number {
  const words = (markdown ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
```

220 wpm is a reasonable average for moderately technical reading. Minimum 1 minute (so zero-word posts don't render "0 min read").

### 3.4 Tag chips

Reuse the existing `TagChip` primitive from Plan 1 (`app/components/primitives/TagChip.vue`). Tags in `content/writing/*.md` frontmatter are already an array of strings; pass them in order.

No linking yet — clicking a tag does nothing in v1. Tag filtering is explicit non-goal.

---

## 4. Prose theme (`prose.css`)

New file at `app/assets/css/prose.css`, imported from `app/assets/css/main.css` after `tokens.css`.

### 4.1 Variable overrides for `@tailwindcss/typography`

Override every `--tw-prose-*` CSS variable on `.prose` to pull from the site's token system. Full list:

```
--tw-prose-body        → var(--text-muted)
--tw-prose-headings    → var(--text)
--tw-prose-lead        → var(--text)
--tw-prose-links       → var(--accent)
--tw-prose-bold        → var(--text)
--tw-prose-counters    → var(--text-dim)
--tw-prose-bullets     → var(--text-dim)
--tw-prose-hr          → var(--line)
--tw-prose-quotes      → var(--text)
--tw-prose-quote-borders → var(--accent)
--tw-prose-captions    → var(--text-dim)
--tw-prose-code        → var(--text)
--tw-prose-pre-code    → var(--text)
--tw-prose-pre-bg      → transparent     (Shiki handles background)
--tw-prose-th-borders  → var(--line)
--tw-prose-td-borders  → var(--line)
```

This means `prose prose-invert` on the post page no longer hardcodes Tailwind's invert palette — it inherits from the site's tokens, so the light theme (if ever enabled) works for free.

### 4.2 Selector-level overrides

Beyond the CSS variable swap, a few selector-level rules:

- `.prose a` — 1px underline, 3px offset, 60%-opacity accent decoration color, transitions to full accent on hover
- `.prose :not(pre) > code` — mono font, 0.9em size, `var(--canvas-raised)` bg, `var(--line)` border, 3px radius, 1px × 5px padding; kills the default `::before`/`::after` backticks
- `.prose pre` — 1px border, 6px radius, 18px × 20px padding, `#0a0a0a` background, `position: relative`, `overflow-x: auto`
- `.prose pre::before` — absolutely-positioned 1px accent gradient bar at `top: 0` (the "content zone" marker)
- `.prose blockquote` — left border color overridden to `var(--accent)`, italic body

### 4.3 Integration into `main.css`

Append one import after `tokens.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@import "./tokens.css";
@import "./prose.css";     /* ← new */
```

---

## 5. `PostNav.vue`

New component at `app/components/writing/PostNav.vue`.

### 5.1 Props

```ts
interface PostRef { slug: string; title: string; }
defineProps<{ prev?: PostRef | null; next?: PostRef | null; }>();
```

### 5.2 Layout

Thin row with a top border:

```
──────────────────────────────────────────────────
← previous · <prev title>         <next title> · next →
```

- 24px vertical padding, 1px top border in `var(--line)`
- Two flex children, `justify-between`
- Each a `NuxtLink` to `/writing/${slug}`
- Long titles truncate with `overflow: hidden; text-overflow: ellipsis; white-space: nowrap;`
- Hover: text color transitions from `text-muted` to `accent`
- When either side is `null`, render an empty spacer on that side so the other stays aligned (left- or right-justified)

### 5.3 Sibling resolution

Pure helper at `app/utils/postNav.ts`:

```ts
import type { PostRef } from "~/types/postNav"; // tiny types file (§7)

interface PostLike {
  stem: string;
  title: string;
  date: string;
}

export function getPostSiblings(
  all: PostLike[],
  currentStem: string
): { prev: PostRef | null; next: PostRef | null } {
  // Sort all posts reverse-chronological (newest first)
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const i = sorted.findIndex(p => p.stem === currentStem);
  if (i === -1) return { prev: null, next: null };
  // In reverse-chron: index+1 is older → "previous"; index-1 is newer → "next"
  const makeRef = (p?: PostLike): PostRef | null =>
    p ? { slug: p.stem.split("/").pop() ?? "", title: p.title } : null;
  return {
    prev: makeRef(sorted[i + 1]),
    next: makeRef(sorted[i - 1]),
  };
}
```

### 5.4 Edge cases

| Scenario | Result |
| --- | --- |
| Current is oldest post | `prev: null`, `next: { ... }` — row shows only right side |
| Current is newest post | `prev: { ... }`, `next: null` — row shows only left side |
| Only one post exists | both null — the nav component renders nothing (guard with `v-if="prev \|\| next"`) |
| Current not found | both null — nav renders nothing |
| Draft posts | already filtered out by the existing `.where("draft", "=", false)` query on the page |

---

## 6. Page wiring (`/writing/[slug].vue`)

Rewrite `app/pages/writing/[slug].vue` to compose the new components:

```vue
<script setup lang="ts">
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

// Reading minutes: @nuxt/content v3 stores parsed body as AST. The cleanest
// approach during implementation is to re-parse the raw markdown via
// queryCollection's raw-body option if available, or fall back to a word-count
// of the stringified AST (noisy but stable). Decide in a 5-min spike.
const reading = computed(() => readingMinutes(extractText(post.value?.body)));

useHead(() => ({ title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph" }));
</script>

<template>
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <PostMetaHeader :date="post.date" :reading-minutes="reading" />
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-4 mt-2">
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

`extractText` is a small helper in `app/utils/readingTime.ts` that walks the @nuxt/content body AST and concatenates `children` leaves (or falls back to `JSON.stringify`). Decide exact shape during implementation.

---

## 7. File structure (produced by this plan)

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
assets/css/main.css                                 # modified: import prose.css
nuxt.config.ts                                      # modified: Shiki config
tests/
├── unit/
│   ├── readingTime.test.ts                         # new, 4 cases
│   └── postNav.test.ts                             # new, 5 cases
└── e2e/
    └── smoke.spec.ts                               # modified: 1 new test
```

---

## 8. Testing

### 8.1 Unit

`tests/unit/readingTime.test.ts` — 4 cases:

| Input | Expected |
| --- | --- |
| `""` (empty) | `1` |
| 220 words | `1` |
| 440 words | `2` |
| 2200 words | `10` |

`tests/unit/postNav.test.ts` — 5 cases:

| Scenario | Expected |
| --- | --- |
| Current in middle of 3 posts | prev and next both populated, correct slugs |
| Current is oldest (last in sorted order) | prev: null, next: populated |
| Current is newest (first in sorted order) | prev: populated, next: null |
| Current stem not in list | prev: null, next: null |
| Single-post array | prev: null, next: null |

### 8.2 E2E

Extend `tests/e2e/smoke.spec.ts` with one new test:

```ts
test("writing post renders meta, syntax-highlighted code, and nav", async ({ page }) => {
  await page.goto("/writing/2026-03-12-first-post");
  // Meta header
  await expect(page.getByText("$ writing/")).toBeVisible();
  await expect(page.getByText(/min read/)).toBeVisible();
  // Title
  await expect(page.getByRole("heading", { level: 1, name: /On craft/i })).toBeVisible();
  // If the seeded post has a code block, assert Shiki-rendered tokens exist
  // (Will be true once real content replaces the placeholder; for now
  // just verify the prose container renders.)
  await expect(page.locator("article .prose")).toBeVisible();
  // PostNav — there are 2 posts, so exactly one side should be populated
  // (this is the 2026-03-12 post, which is newer → should show "← previous").
  await expect(page.getByText(/← previous/)).toBeVisible();
});
```

### 8.3 Manual verification

- Visit `/writing/2026-03-12-first-post` — meta header, title, tag chips, prose body all render; accent underlines on links
- Add a code block to one of the seeded posts temporarily (`\`\`\`ts\nconst x = 1;\n\`\`\``) and confirm the custom Shiki theme colors appear; revert the edit
- `Ctrl+P` print preview — the prose container still respects `@media print` reset from Plan 1 (nothing should regress)
- Resize to 390px — prose body stays readable, no horizontal overflow in code blocks (they scroll internally)

---

## 9. Open questions (to decide during implementation)

1. **@nuxt/content highlight config path** — exact key in Nuxt 4 + @nuxt/content 3.13. `content.build.markdown.highlight` is the most likely, but if the API has moved (or is under `content.markdown.highlight`), adjust. 5-minute doc check.
2. **Raw markdown vs AST for reading time** — if @nuxt/content exposes the raw body text on the query result, use it directly. Otherwise, a small AST walker in `readingTime.ts` that accumulates `node.children` leaves.
3. **Shiki theme loading** — @nuxt/content accepts either a theme name (for bundled themes) or an inline theme object. If it refuses to load a theme from a file path, inline the theme object via the nuxt.config.

---

## 10. Out of scope (future work)

- Tag index pages (`/writing/tags/[tag]`) with filtered post lists
- RSS feed generation (would naturally happen after real posts exist)
- Table of contents for long posts (YAGNI until posts exist with 5+ headings)
- Code-block copy-to-clipboard button
- Reading progress indicator
- Search across posts
- Related posts (by tag overlap)
