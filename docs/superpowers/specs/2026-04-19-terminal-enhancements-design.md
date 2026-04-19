# Résumé terminal enhancements — design spec

**Date:** 2026-04-19
**Project:** `digitalseraph-vue`
**Route touched:** `/resume`
**Status:** Design approved, pending implementation plan
**Supersedes:** parts of `2026-04-18-resume-terminal-design.md` (dispatcher shape, command set, prompt styling, unknown-command error format). Keeps the original auto-type intro, sidebar interaction, print view, and overall structure.

---

## 1. Overview

Grow `/resume`'s terminal from a curated 10-command résumé viewer into something that actually feels like a real shell — with command history (↑/↓), tab completion, bash-style error messages, a richer prompt, and a larger command set including directory listings (`ls`), path-based `cat`, `grep`-search, and a handful of shell-flavor commands (`date`, `uname`, `echo`, `sudo`, `exit`, `theme`).

**Goals**

- Reward repeat visitors: the terminal has depth now, not just the five résumé sections
- Feel genuinely shell-like when typed into (history, tab-complete, canonical error format)
- Keep every existing command and behavior working unchanged
- Keep the dispatcher pure (side effects handled by the orchestrator)

**Non-goals (v1)**

- Filesystem state (`cd`, `pwd`, current directory-aware `ls`) — doubles complexity; `ls` always takes an explicit path
- Pipes (`|`) — nothing on the left side produces pipeable output in a natural way
- Argument flags (`ls -la`, `cat -n`) — parser overhead with little content value
- Real shell quoting — treat `echo "hi"` as two args (`"hi"` with literal quotes). Users who want full shell semantics aren't the audience
- ASCII-art banner (tricky to get right, low value)
- `rm -rf /` joke (low value)

---

## 2. Dispatcher refactor

### 2.1 Parsed-input shape

```ts
interface ParsedCommand {
  cmd: string;        // first whitespace-delimited token, lowercased
  args: string[];     // remaining tokens, original case preserved
  raw: string;        // original trimmed input, for echo/error messages
}

export function parseInput(raw: string): ParsedCommand;
```

`parseInput` splits on whitespace, lowercases `cmd`, preserves `args` case, and collapses internal whitespace. It does NOT attempt shell quoting.

### 2.2 `OutputEntry` extended

```ts
export type OutputEntry =
  | { kind: "text"; text: string }
  | { kind: "component"; name: OutputComponentName; props?: Record<string, unknown> }
  | { kind: "clear" }
  | { kind: "navigate"; path: string }
  | { kind: "theme"; mode: "light" | "dark" }
  | { kind: "print" }
  | null;
```

Three new kinds replace what was previously done impurely inside the dispatcher:

- `"navigate"` — orchestrator calls `useRouter().push(path)`
- `"theme"` — orchestrator calls `useThemeStore().setMode(mode)`
- `"print"` — orchestrator calls `window.print()` (previously the dispatcher called this directly inside the `pdf` case)

The dispatcher becomes genuinely pure for the first time: no `window.*` reads or writes.

### 2.3 Dispatcher signature

```ts
export function dispatchCommand(parsed: ParsedCommand, ctx: DispatchContext): OutputEntry;
```

See §4.1 for the full `DispatchContext` shape.

Flow:

1. If `parsed.cmd === ""` → return `null` (empty input, no-op; orchestrator drops the buffer entry)
2. Look up handler in a `Record<string, Handler>` table keyed by canonical command name
3. Fall through to unknown-command handler on miss

Handlers are pure functions: `(args: string[], ctx: DispatchContext) => OutputEntry`. Each is named and declared at module scope for clear test coverage.

### 2.4 Unknown command handler

Output:
```
bash: <cmd>: command not found
```

Matches real zsh/bash output. Dropped the "try 'help'." suffix — real shells don't add help hints, and the `help` command is discoverable via the sidebar. Keep rendering in `text-dim` color.

---

## 3. Command set

### 3.1 Existing (unchanged semantics)

| Command | Output |
| --- | --- |
| `whoami` | `WhoamiBlock` (component) |
| `cat summary.md` | Text — `resume.summary` |
| `cat experience.md` | `ExperienceList` |
| `ls skills/` | `SkillsGrid` |
| `cat education.md` | `EducationBlock` |
| `contact` | `ContactBlock` |
| `help` / `?` | `HelpBlock` (updated content — §3.4) |
| `clear` | Clear kind |
| `pdf` | Print kind (replaces direct `window.print()` call) |

### 3.2 New — content paths

**`ls`** (no args) — directory listing of the virtual "filesystem":

```
summary.md  experience.md  education.md  contact
skills/     projects/      writing/
```

Rendered by a new `DirectoryListing` component with props `{ items: DirEntry[] }` where `DirEntry = { name, kind: "file" | "dir", link?: string }`. Files and dirs styled differently (dirs with trailing `/` in accent color); items with a `link` are clickable.

**`ls projects/`** — list of project slugs (derived from `queryCollection("work")` at build time, baked into the dispatcher? or loaded at runtime?).

→ **Decision**: load at runtime. The dispatcher receives a `context` object with `{ resume, projects: ProjectRef[], posts: PostRef[] }`. See §4 for context shape.

**`ls writing/`** — list of post slugs (non-draft, ordered date DESC).

**`cat projects/<slug>.md`** — inline project summary. `ProjectPreview` component with props `{ slug: string }`; the component does its own `queryCollection("work").where("stem", "=", \`work/${slug}\`).first()` and renders role + year + stack + summary + "read case study →" link.

**`cat projects/<bad-slug>.md`** — text output: `cat: projects/<bad-slug>.md: No such file or directory`

**`cat writing/<slug>.md`** — mirror of projects but for posts.

### 3.3 New — search

**`grep <term>`** — case-insensitive substring search across:

- Each experience bullet (result: `experience/<company>/<line-index>`)
- Each skill item (result: `skills/<group>/<item>`)
- Project titles + summaries (result: `projects/<slug>`)
- Post titles + excerpts (result: `writing/<slug>`)

Output: `GrepResults` component with props `{ term: string; matches: GrepMatch[] }` where each `GrepMatch = { source: string; snippet: string; link?: string }`. Empty `matches` → text output `(no matches)`.

**`grep`** (no args) → text: `grep: missing search term. usage: grep <term>`

### 3.4 New — shell flavor

| Command | Output |
| --- | --- |
| `date` | Text — `new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })` |
| `uname` | Text — `digitalseraph` |
| `uname -a` | Text — `digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)` |
| `echo <args...>` | Text — `args.join(" ")`, rendered via Vue interpolation so user input is never HTML-interpreted |
| `sudo <anything>` | Text — `user <name> is not in the sudoers file.  This incident will be reported.` (two spaces, matches real sudo) |
| `exit` / `logout` | Navigate kind — `/` |
| `theme` (no args) | Text — `current theme: <mode>` from `useThemeStore().mode` (orchestrator injects current mode into the dispatcher context) |
| `theme light` | Theme kind — `light` |
| `theme dark` | Theme kind — `dark` |
| `theme <other>` | Text — `theme: invalid mode '<other>'. valid modes: light, dark` |

### 3.5 Updated `HelpBlock`

Grows from 9 rows to ~20, organized into three labeled sections:

```
-- sections --
whoami              identity
cat summary.md      professional summary
cat experience.md   full work history
ls skills/          skills grouped by category
cat education.md    education + certifications
contact             email + github + linkedin

-- filesystem --
ls                  list top-level entries
ls projects/        list project case studies
ls writing/         list blog posts
cat projects/<slug>.md   preview a project
cat writing/<slug>.md    preview a post
grep <term>         search across résumé + content

-- shell --
date                current date
uname [-a]          system info
echo <text>         print text
sudo                please no
theme [light|dark]  show or set theme
exit, logout        leave the terminal
clear               wipe the buffer
help, ?             this list
pdf                 open Save-as-PDF dialog
```

---

## 4. Orchestrator changes

`ResumeTerminal.vue` grows to handle the new side-effect kinds and to inject context into the dispatcher.

### 4.1 Dispatcher context

The dispatcher's signature stays `(parsed, resume)` but the `resume` arg becomes a richer "context" object so handlers can reference more than just the résumé:

```ts
interface DispatchContext {
  resume: Resume;
  projects: ProjectRef[];   // { slug, title, year, stack, summary } × 5
  posts: PostRef[];         // { slug, title, date, excerpt } × N
  themeMode: "light" | "dark";  // for `theme` (no args)
  prompt: { user: string };     // for `sudo` (uses user's random id in the message)
}
```

Signature becomes `dispatchCommand(parsed, ctx)`. Passing existing `resume` arg inside the context; handlers pull what they need.

`ResumeTerminal` assembles the context on mount via `useResume()`, `queryCollection("work").order("year", "DESC").all()`, `queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()`, and stores mode from `useThemeStore()`.

### 4.2 Side-effect handling

The orchestrator's `runCommand` function processes each kind:

```ts
const output = dispatchCommand(parsed, ctx);

switch (output?.kind) {
  case "clear":
    buffer.value = [];
    break;
  case "navigate":
    router.push(output.path);
    break;
  case "theme":
    themeStore.setMode(output.mode);
    // emit a text entry confirming the change
    buffer.value = [...buffer.value, { id: nextId(), input: parsed.raw, output: { kind: "text", text: `theme: ${output.mode}` } }];
    break;
  case "print":
    if (typeof window !== "undefined") window.print();
    break;
  case null:
    // no-op (e.g., empty input)
    break;
  default:
    buffer.value = [...buffer.value, { id: nextId(), input: parsed.raw, output }];
}
```

### 4.3 Command history

`ResumeTerminal` owns `history: string[]`. Every dispatched command (non-empty, non-whitespace-only) gets appended to history. History is in-memory only (per Vue instance), lost on route leave and refresh. This matches a real shell session.

Exposed to `ResumePrompt` via a prop `:history="history"` so the prompt can do its own navigation.

### 4.4 `sessionStorage` username

`useRandomUsername()` composable:

```ts
export function useRandomUsername(): string {
  if (typeof window === "undefined") return "";  // SSR-safe
  const key = "ds-terminal-user";
  let stored = sessionStorage.getItem(key);
  if (!stored) {
    stored = "user" + String(Math.floor(Math.random() * 90000) + 10000);
    sessionStorage.setItem(key, stored);
  }
  return stored;
}
```

`ResumePrompt` calls this in `onMounted` and populates a local ref; during SSR the prompt renders `user@digitalseraph:~$` (or with an empty span in place of the number) and the real number appears 1 frame after hydration.

---

## 5. Prompt component (`ResumePrompt.vue`)

### 5.1 Visual

Current template:
```vue
<span class="text-[var(--accent)]">$</span>
<input ... />
<span class="cursor-blink" />
```

New template:
```vue
<span class="font-mono text-[var(--accent)]">{{ username }}</span>
<span class="font-mono text-[var(--text-muted)]">@digitalseraph</span>
<span class="font-mono text-[var(--text-dim)]">:</span>
<span class="font-mono text-[var(--text-muted)]">~</span>
<span class="font-mono text-[var(--accent)]">$</span>
<input ... />
<span class="cursor-blink" />
```

`username` is populated on mount via `useRandomUsername()`.

### 5.2 Keyboard handling

Add to the `onKey` handler (in addition to current Enter):

- **↑ (ArrowUp)**: if `history.length > 0`:
  - If not currently browsing (`historyIndex === -1`), set to `history.length - 1` and show that entry
  - Else decrement toward 0
- **↓ (ArrowDown)**: if browsing:
  - Increment; if past the newest (`historyIndex >= history.length`), clear input and reset `historyIndex = -1`
- **Tab**: `preventDefault()`, then:
  - Call `getCompletions(input, { commands, projects, posts })` (see §5.3 for the `CompleteContext` shape). `ResumeTerminal` owns and passes these arrays down via a prop on `ResumePrompt`.
  - Single match (`completion` set) → replace input with the completion
  - Multiple matches (`candidates` non-empty) → emit `candidates` event; `ResumeTerminal` appends a buffer entry listing them (bash double-tab behavior)

Each Enter resets `historyIndex = -1`.

### 5.3 New composables

`app/composables/useTerminalHistory.ts` — pure state management for the prompt's history navigation:

```ts
export function useTerminalHistory(history: Ref<string[]>) {
  const index = ref(-1);
  function up() { /* ... */ }
  function down() { /* ... */ }
  function reset() { index.value = -1; }
  const currentEntry = computed(() => index.value === -1 ? null : history.value[index.value]);
  return { index, up, down, reset, currentEntry };
}
```

`app/utils/tabComplete.ts` — pure function for tab completion:

```ts
interface CompleteContext {
  commands: string[];   // all valid command names
  projects: string[];   // project slugs for `cat projects/<slug>.md`
  posts: string[];      // post slugs for `cat writing/<slug>.md`
}

export function getCompletions(input: string, ctx: CompleteContext): {
  completion: string | null;
  candidates: string[];
};
```

Matches:
- `input` matches one or more command names by prefix → candidates are those commands
- `input` starts with `cat projects/` and partially matches a slug → candidates are matching project slugs as full `cat projects/<slug>.md` strings
- `input` starts with `cat writing/` → same for posts
- `input` starts with `ls` → candidates include `ls projects/`, `ls writing/`, `ls skills/`
- No matches → `{ completion: null, candidates: [] }`
- One match → `{ completion: <full-string>, candidates: [] }`
- Multiple → `{ completion: null, candidates: [...] }`

---

## 6. New components

All in `app/components/resume/outputs/`:

- `DirectoryListing.vue` — props `{ items: DirEntry[] }`. Renders a grid of items with `/` suffix for dirs and mono styling. Items with `link` are `NuxtLink`s to that path.
- `ProjectPreview.vue` — props `{ slug: string }`. Fetches via `queryCollection("work")`, renders role/year/stack chips/summary + "read case study →" link.
- `PostPreview.vue` — props `{ slug: string }`. Fetches from `queryCollection("writing")`, renders date/reading time/tags/excerpt + "read post →" link.
- `GrepResults.vue` — props `{ term: string; matches: GrepMatch[] }`. Renders grouped-by-source list with the matched term highlighted via a `<mark class="bg-transparent text-[var(--accent)]">` span. Empty matches → text.

Keep the existing 6 output components (`WhoamiBlock`, `ExperienceList`, `SkillsGrid`, `EducationBlock`, `ContactBlock`, `HelpBlock`) — they don't change.

Total output components after this plan: **10**.

### `OutputComponentName` literal union updated

```ts
export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock"
  | "DirectoryListing"
  | "ProjectPreview"
  | "PostPreview"
  | "GrepResults";
```

`ResumeEntry.vue`'s `outputMap` type strengthens from `Record<OutputComponentName, Component>` to include all 10. Components are imported at the top and mapped.

When `output.kind === "component"` with `output.props`, `ResumeEntry` passes them through via `v-bind`:

```vue
<component v-else-if="component" :is="component" v-bind="output.props ?? {}" />
```

---

## 7. Testing

### 7.1 Unit (Vitest)

**Dispatcher** — `tests/unit/resumeDispatcher.test.ts` (rewritten):

- `parseInput` — 5 tests: empty string, single command, command + args, multiple whitespace, no-special-quote-handling
- `dispatchCommand` — per-command, replacing the 13 prior:
  - Existing commands (9 tests, adapted to new parsed-input shape)
  - `ls` no-args (1)
  - `ls projects/` (1)
  - `ls writing/` (1)
  - `cat projects/<valid-slug>.md` (1)
  - `cat projects/<bad-slug>.md` → "No such file or directory" (1)
  - `cat writing/<valid-slug>.md` (1)
  - `cat writing/<bad-slug>.md` (1)
  - `grep <match-in-experience>` (1)
  - `grep <match-in-skills>` (1)
  - `grep <no-match>` → empty matches (1)
  - `grep` no args → usage text (1)
  - `date` (1)
  - `uname` and `uname -a` (2)
  - `echo hello world` (1)
  - `echo <script>alert(1)</script>` — asserts output kind is `text`, not `component` with html (1 — security)
  - `sudo anything` (1)
  - `exit` and `logout` (2)
  - `theme` no args (1)
  - `theme light` and `theme dark` (2)
  - `theme bogus` → invalid-mode text (1)
  - Unknown → bash-style error (1)

Unit total: roughly 32 tests replacing the 13 previous.

**Composables:**

- `useTerminalHistory` — `tests/unit/useTerminalHistory.test.ts` (new): 4 tests — up from empty, up navigates back, down clears past newest, reset
- `tabComplete.getCompletions` — `tests/unit/tabComplete.test.ts` (new): 6 tests — single command match, multiple matches, `cat projects/` with partial slug, `cat writing/` with partial slug, `ls ` partial, no match

### 7.2 Component (Vitest + mountSuspended)

**`ResumePrompt`** — `tests/component/ResumePrompt.test.ts` (new): 4 tests

- ↑ recalls the most recent history entry
- ↑↑ walks further back; ↓ walks forward
- Tab with single-match completion sets input to the full command
- Tab with multi-match emits `candidates` event (no input change)

### 7.3 E2E (Playwright)

**`tests/e2e/resume.spec.ts`** — append 4 new tests:

- `ls projects/` renders all 5 project slugs (grep for Jump, Thrivee, GoFan, TRPZ, Editorial)
- `grep Vue` returns matching results (assert at least one result with "Vue" visible in output)
- `theme light` flips `<html data-theme="light">` and persists through a reload
- Typing `whoami` + Enter, then ↑, restores `whoami` into the input

### 7.4 Totals after this plan

| Layer | Before | After | Delta |
| --- | --- | --- | --- |
| Unit | 49 | ~65 | +16 (net; dispatcher tests swap but grow) |
| Component | 4 | 8 | +4 |
| E2E | 14 | 18 | +4 |
| **Total** | **67** | **~91** | **+24** |

---

## 8. Security

Treating user input as text is critical. Every place in the new components that renders echoed text or search-term matches uses Vue interpolation (`{{ text }}`), never `v-html`. Specifically called out:

- `echo <args>` output — interpolation only
- `GrepResults` term highlight — interpolation of the matched fragment, surrounded by a static `<mark>` element; the term itself never touches `innerHTML`
- `DirectoryListing` item names — interpolation

One dedicated test (noted in §7.1) asserts that `echo <script>alert(1)</script>` produces a text OutputEntry, not a component-with-html one. At the component layer, the interpolation guarantee is structural — Vue doesn't parse `{{ }}` as HTML.

---

## 9. File structure (produced by this plan)

```
app/
├── components/
│   └── resume/
│       ├── ResumeTerminal.vue          # MODIFIED — dispatches context, handles new side-effect kinds
│       ├── ResumePrompt.vue            # MODIFIED — new prompt template, keyboard handling for ↑/↓/Tab
│       ├── ResumeEntry.vue             # MODIFIED — outputMap extended, v-bind props
│       └── outputs/
│           ├── DirectoryListing.vue    # NEW
│           ├── ProjectPreview.vue      # NEW
│           ├── PostPreview.vue         # NEW
│           └── GrepResults.vue         # NEW
├── composables/
│   ├── useRandomUsername.ts            # NEW
│   └── useTerminalHistory.ts           # NEW
├── utils/
│   ├── resumeDispatcher.ts             # REWRITTEN — parseInput, new OutputEntry, per-command handlers
│   └── tabComplete.ts                  # NEW
└── types/
    └── (no new files; ParsedCommand + DispatchContext + DirEntry + GrepMatch inline in resumeDispatcher.ts)
tests/
├── unit/
│   ├── resumeDispatcher.test.ts        # REWRITTEN
│   ├── useTerminalHistory.test.ts      # NEW
│   └── tabComplete.test.ts             # NEW
├── component/
│   └── ResumePrompt.test.ts            # NEW
└── e2e/
    └── resume.spec.ts                  # MODIFIED — +4 tests
```

---

## 10. Open items (to resolve during implementation)

1. **`HelpBlock` layout** — the existing 2-column table may need a grouped-with-dividers layout for ~20 rows. Decide during implementation based on visual density.
2. **Buffer interrupt on slow typing** — if the user starts typing a new command while an async output component is still hydrating, the new command starts immediately; no queue, no cancel. Carried over from the existing design.
3. **Tab completion for case-mixed input** — current plan: case-insensitive prefix match, preserving the user's original casing in the completed output (so `CaT EXP<Tab>` completes to `cat experience.md` not `CaT EXPerience.md`). Worth verifying feel during implementation.

---

## 11. Out of scope (future work)

- Filesystem state (`cd`, `pwd`, cwd-aware `ls`)
- Pipes (`|`)
- Argument flags (`ls -la`, `cat -n`)
- Real shell quoting
- ASCII-art banner
- `rm -rf /` joke
- Persistent history across reloads (localStorage)
- Multi-terminal tabs
