# Terminal Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `/resume`'s terminal into a genuine shell — history (↑/↓), Tab completion, bash-style errors, `user<rand>@digitalseraph:~$` prompt, and new commands (`ls`, `cat <path>`, `grep`, `date`, `uname`, `echo`, `sudo`, `exit`, `theme`).

**Architecture:** Rewrite the dispatcher as pure `(ParsedCommand, DispatchContext) → OutputEntry`, with new `navigate`/`theme`/`print` side-effect kinds handled by the `ResumeTerminal` orchestrator. Add four new output components, two new composables (`useRandomUsername`, `useTerminalHistory`), and a pure `tabComplete` utility. All existing commands keep working.

**Tech Stack:** Nuxt 4 + Vue 3 + TypeScript strict, Pinia, `@nuxt/content` v3 (`queryCollection`), Vitest + `@nuxt/test-utils/runtime`, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-19-terminal-enhancements-design.md`

---

## File Structure

New / modified files, grouped by responsibility:

**Dispatcher & utilities:**
- `app/utils/resumeDispatcher.ts` — REWRITTEN. `parseInput`, `ParsedCommand`, extended `OutputEntry`, `DispatchContext`, one handler per command.
- `app/utils/tabComplete.ts` — NEW. Pure `getCompletions(input, ctx)` returning `{ completion, candidates }`.

**Composables:**
- `app/composables/useRandomUsername.ts` — NEW. Returns persisted `user<5-digit>` string via `sessionStorage`.
- `app/composables/useTerminalHistory.ts` — NEW. Up/down navigation state machine over a `Ref<string[]>`.

**Stores:**
- `app/stores/theme.ts` — MODIFIED. Add `setMode(mode)` action.

**Orchestrator & prompt:**
- `app/components/resume/ResumeTerminal.vue` — MODIFIED. Assembles `DispatchContext`, owns history, handles new side-effect kinds, passes history + tab context to prompt.
- `app/components/resume/ResumePrompt.vue` — MODIFIED. New `user<rand>@digitalseraph:~$` template, ↑/↓ history nav, Tab completion.
- `app/components/resume/ResumeEntry.vue` — MODIFIED. `outputMap` extended to 10 components, passes `output.props` via `v-bind`.

**New output components** (`app/components/resume/outputs/`):
- `DirectoryListing.vue` — NEW. Renders `{ items: DirEntry[] }` as a filesystem-style listing.
- `ProjectPreview.vue` — NEW. Fetches project by slug, renders preview card.
- `PostPreview.vue` — NEW. Fetches post by slug, renders preview card.
- `GrepResults.vue` — NEW. Renders grouped matches with highlighted term.

**Modified output components:**
- `app/components/resume/outputs/HelpBlock.vue` — MODIFIED. 3-section layout with ~20 rows.

**Tests:**
- `tests/unit/resumeDispatcher.test.ts` — REWRITTEN.
- `tests/unit/tabComplete.test.ts` — NEW.
- `tests/unit/useTerminalHistory.test.ts` — NEW.
- `tests/unit/useRandomUsername.test.ts` — NEW.
- `tests/unit/theme.test.ts` — MODIFIED (append `setMode` tests).
- `tests/component/ResumePrompt.test.ts` — NEW.
- `tests/e2e/resume.spec.ts` — MODIFIED. +4 tests.

---

## Commit Style

Past commits on this repo use plain short-form subject lines (e.g. `Extract digitalseraph-vue into its own repository`). Follow that style. Every task ends with a commit that passes the unit-test task it introduces.

---

## Task 1: Add `setMode` action to theme store

**Files:**
- Modify: `app/stores/theme.ts`
- Modify: `tests/unit/theme.test.ts`

The dispatcher's `theme light` / `theme dark` need a deterministic setter (current store only exposes `toggle`). Mirror `toggle`'s persistence + apply behavior.

- [ ] **Step 1: Read the existing theme test to understand patterns**

Open `tests/unit/theme.test.ts` to see how the store is exercised.

- [ ] **Step 2: Append failing tests for `setMode`**

Add to `tests/unit/theme.test.ts`:

```ts
  it("setMode sets mode, persists, and applies", () => {
    const store = useThemeStore();
    store.setMode("light");
    expect(store.mode).toBe("light");
    expect(localStorage.getItem("ds-theme")).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    store.setMode("dark");
    expect(store.mode).toBe("dark");
    expect(localStorage.getItem("ds-theme")).toBe("dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
  });
```

- [ ] **Step 3: Run it to verify FAIL**

Run: `pnpm test:unit -- theme`
Expected: fail — `store.setMode is not a function`.

- [ ] **Step 4: Add `setMode` action to the store**

In `app/stores/theme.ts`, inside `actions:`, add after `toggle`:

```ts
    setMode(mode: ThemeMode) {
      this.mode = mode;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, this.mode);
      }
      this.apply();
    },
```

- [ ] **Step 5: Run the tests to verify PASS**

Run: `pnpm test:unit -- theme`
Expected: all theme tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/stores/theme.ts tests/unit/theme.test.ts
git commit -m "Add setMode action to theme store"
```

---

## Task 2: `useRandomUsername` composable

**Files:**
- Create: `app/composables/useRandomUsername.ts`
- Create: `tests/unit/useRandomUsername.test.ts`

Generates / returns a persisted `user<5-digit>` string (e.g. `user32451`). Persisted in `sessionStorage` under `ds-terminal-user`. Must be SSR-safe (no `window` access at import time).

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/useRandomUsername.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRandomUsername } from "~/composables/useRandomUsername";

describe("useRandomUsername", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("generates a user<5-digit> string on first call", () => {
    const name = useRandomUsername();
    expect(name).toMatch(/^user\d{5}$/);
  });

  it("persists the same value across calls in the same session", () => {
    const a = useRandomUsername();
    const b = useRandomUsername();
    expect(a).toBe(b);
  });

  it("reads an existing sessionStorage value instead of regenerating", () => {
    sessionStorage.setItem("ds-terminal-user", "user99999");
    expect(useRandomUsername()).toBe("user99999");
  });

  it("generates pads-to-5-digits values (10000-99999)", () => {
    // Force the lower bound
    vi.spyOn(Math, "random").mockReturnValue(0);
    sessionStorage.clear();
    const a = useRandomUsername();
    expect(a).toBe("user10000");

    // Force the upper bound
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    sessionStorage.clear();
    const b = useRandomUsername();
    expect(b).toBe("user99999");
  });
});
```

- [ ] **Step 2: Run it to verify FAIL**

Run: `pnpm test:unit -- useRandomUsername`
Expected: fail — composable not found.

- [ ] **Step 3: Create the composable**

Create `app/composables/useRandomUsername.ts`:

```ts
const STORAGE_KEY = "ds-terminal-user";

export function useRandomUsername(): string {
  if (typeof window === "undefined") return "";
  let stored = window.sessionStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const n = Math.floor(Math.random() * 90000) + 10000;
    stored = `user${n}`;
    window.sessionStorage.setItem(STORAGE_KEY, stored);
  }
  return stored;
}
```

- [ ] **Step 4: Run the tests to verify PASS**

Run: `pnpm test:unit -- useRandomUsername`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useRandomUsername.ts tests/unit/useRandomUsername.test.ts
git commit -m "Add useRandomUsername composable"
```

---

## Task 3: `useTerminalHistory` composable

**Files:**
- Create: `app/composables/useTerminalHistory.ts`
- Create: `tests/unit/useTerminalHistory.test.ts`

State machine for ↑/↓ history navigation. Takes a `Ref<string[]>` of commands and returns methods to walk through it. `index === -1` means "not browsing" (i.e. showing the user's current in-progress input).

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/useTerminalHistory.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useTerminalHistory } from "~/composables/useTerminalHistory";

describe("useTerminalHistory", () => {
  it("currentEntry is null when not browsing (index === -1)", () => {
    const history = ref(["whoami", "help"]);
    const nav = useTerminalHistory(history);
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("up() from fresh state selects the newest entry", () => {
    const history = ref(["whoami", "help", "contact"]);
    const nav = useTerminalHistory(history);
    nav.up();
    expect(nav.index.value).toBe(2);
    expect(nav.currentEntry.value).toBe("contact");
  });

  it("up() walks backward and clamps at 0", () => {
    const history = ref(["a", "b", "c"]);
    const nav = useTerminalHistory(history);
    nav.up(); // -> c (index 2)
    nav.up(); // -> b (index 1)
    nav.up(); // -> a (index 0)
    nav.up(); // clamp at 0
    expect(nav.index.value).toBe(0);
    expect(nav.currentEntry.value).toBe("a");
  });

  it("down() walks forward and resets to -1 past the newest", () => {
    const history = ref(["a", "b", "c"]);
    const nav = useTerminalHistory(history);
    nav.up(); nav.up(); // at index 1 (b)
    nav.down(); // -> c (index 2)
    expect(nav.currentEntry.value).toBe("c");
    nav.down(); // past newest -> reset
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("up() on an empty history is a no-op", () => {
    const history = ref<string[]>([]);
    const nav = useTerminalHistory(history);
    nav.up();
    expect(nav.index.value).toBe(-1);
    expect(nav.currentEntry.value).toBeNull();
  });

  it("reset() returns to -1", () => {
    const history = ref(["a", "b"]);
    const nav = useTerminalHistory(history);
    nav.up();
    nav.reset();
    expect(nav.index.value).toBe(-1);
  });
});
```

- [ ] **Step 2: Run it to verify FAIL**

Run: `pnpm test:unit -- useTerminalHistory`
Expected: fail — composable not found.

- [ ] **Step 3: Create the composable**

Create `app/composables/useTerminalHistory.ts`:

```ts
import { ref, computed, type Ref } from "vue";

export function useTerminalHistory(history: Ref<string[]>) {
  const index = ref(-1);

  function up() {
    const len = history.value.length;
    if (len === 0) return;
    if (index.value === -1) {
      index.value = len - 1;
    } else if (index.value > 0) {
      index.value -= 1;
    }
  }

  function down() {
    const len = history.value.length;
    if (index.value === -1) return;
    if (index.value >= len - 1) {
      index.value = -1;
    } else {
      index.value += 1;
    }
  }

  function reset() {
    index.value = -1;
  }

  const currentEntry = computed(() =>
    index.value === -1 ? null : (history.value[index.value] ?? null)
  );

  return { index, up, down, reset, currentEntry };
}
```

- [ ] **Step 4: Run the tests to verify PASS**

Run: `pnpm test:unit -- useTerminalHistory`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useTerminalHistory.ts tests/unit/useTerminalHistory.test.ts
git commit -m "Add useTerminalHistory composable"
```

---

## Task 4: `tabComplete.getCompletions` utility

**Files:**
- Create: `app/utils/tabComplete.ts`
- Create: `tests/unit/tabComplete.test.ts`

Pure function. Returns `{ completion, candidates }` for a given input string and context arrays. Case-insensitive prefix match. Path-aware for `cat projects/`, `cat writing/`, and `ls `.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/tabComplete.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { getCompletions } from "~/utils/tabComplete";

const ctx = {
  commands: [
    "whoami", "cat summary.md", "cat experience.md", "cat education.md",
    "ls", "ls skills/", "ls projects/", "ls writing/",
    "contact", "help", "clear", "pdf",
    "date", "uname", "echo", "sudo", "exit", "logout", "theme", "grep",
  ],
  projects: ["01-jump", "02-thrivee-hipaa", "03-gofan-docker"],
  posts: ["hello-world", "building-the-site"],
};

describe("getCompletions", () => {
  it("completes a unique command prefix", () => {
    const r = getCompletions("who", ctx);
    expect(r.completion).toBe("whoami");
    expect(r.candidates).toEqual([]);
  });

  it("returns multiple candidates when the prefix is ambiguous", () => {
    const r = getCompletions("c", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual(expect.arrayContaining(["cat summary.md", "contact", "clear"]));
  });

  it("completes a partial project slug after 'cat projects/'", () => {
    const r = getCompletions("cat projects/01", ctx);
    expect(r.completion).toBe("cat projects/01-jump.md");
    expect(r.candidates).toEqual([]);
  });

  it("lists multiple project candidates", () => {
    const r = getCompletions("cat projects/0", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual([
      "cat projects/01-jump.md",
      "cat projects/02-thrivee-hipaa.md",
      "cat projects/03-gofan-docker.md",
    ]);
  });

  it("completes a partial post slug after 'cat writing/'", () => {
    const r = getCompletions("cat writing/hello", ctx);
    expect(r.completion).toBe("cat writing/hello-world.md");
  });

  it("returns null completion + empty candidates when nothing matches", () => {
    const r = getCompletions("xyz", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual([]);
  });

  it("matches case-insensitively but returns the canonical completion", () => {
    const r = getCompletions("WHO", ctx);
    expect(r.completion).toBe("whoami");
  });
});
```

- [ ] **Step 2: Run it to verify FAIL**

Run: `pnpm test:unit -- tabComplete`
Expected: fail — module not found.

- [ ] **Step 3: Create the utility**

Create `app/utils/tabComplete.ts`:

```ts
export interface CompleteContext {
  commands: string[];
  projects: string[];
  posts: string[];
}

export interface CompletionResult {
  completion: string | null;
  candidates: string[];
}

function byPrefix(prefix: string, all: string[]): string[] {
  const lower = prefix.toLowerCase();
  return all.filter((c) => c.toLowerCase().startsWith(lower));
}

function result(matches: string[]): CompletionResult {
  if (matches.length === 1) return { completion: matches[0]!, candidates: [] };
  if (matches.length === 0) return { completion: null, candidates: [] };
  return { completion: null, candidates: matches };
}

export function getCompletions(input: string, ctx: CompleteContext): CompletionResult {
  const trimmed = input.trimStart();
  if (trimmed === "") return { completion: null, candidates: [] };

  const projectsPrefix = "cat projects/";
  const writingPrefix = "cat writing/";

  if (trimmed.toLowerCase().startsWith(projectsPrefix)) {
    const slugFrag = trimmed.slice(projectsPrefix.length).replace(/\.md$/, "");
    const matches = byPrefix(slugFrag, ctx.projects).map((s) => `${projectsPrefix}${s}.md`);
    return result(matches);
  }

  if (trimmed.toLowerCase().startsWith(writingPrefix)) {
    const slugFrag = trimmed.slice(writingPrefix.length).replace(/\.md$/, "");
    const matches = byPrefix(slugFrag, ctx.posts).map((s) => `${writingPrefix}${s}.md`);
    return result(matches);
  }

  const matches = byPrefix(trimmed, ctx.commands);
  return result(matches);
}
```

- [ ] **Step 4: Run the tests to verify PASS**

Run: `pnpm test:unit -- tabComplete`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/utils/tabComplete.ts tests/unit/tabComplete.test.ts
git commit -m "Add tabComplete utility"
```

---

## Task 5: Dispatcher rewrite — parseInput + types + existing commands

**Files:**
- Rewrite: `app/utils/resumeDispatcher.ts`
- Rewrite: `tests/unit/resumeDispatcher.test.ts`

Rewrite the dispatcher with the new shape: `parseInput` produces `ParsedCommand`; `dispatchCommand(parsed, ctx)` dispatches via a handler table. Port the 9 existing commands (`whoami`, `cat summary.md`, `cat experience.md`, `ls skills/`, `cat education.md`, `contact`, `help`/`?`, `clear`, `pdf`) and keep the old unknown-command text format for now — Task 6 swaps it to the bash format. `pdf` now returns `{ kind: "print" }` instead of calling `window.print()` directly.

This task is bigger than subsequent ones because the whole test file and all call-sites share a signature. Orchestrator updates come in Task 7.

- [ ] **Step 1: Replace the dispatcher test with the new shape**

Overwrite `tests/unit/resumeDispatcher.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseInput, dispatchCommand, type DispatchContext } from "~/utils/resumeDispatcher";
import type { Resume } from "~/types/resume";

const resume: Resume = {
  header: { name: "X", title: "Y", location: "Z", email: "a@b", github: "gh", linkedin: "li" },
  summary: "fake summary",
  experience: [],
  education: [],
  certifications: [],
  skills: [],
  contact: { email: "a@b", github: "gh", linkedin: "li" },
};

const ctx: DispatchContext = {
  resume,
  projects: [],
  posts: [],
  themeMode: "dark",
  prompt: { user: "user12345" },
};

describe("parseInput", () => {
  it("returns an empty-cmd ParsedCommand for blank input", () => {
    expect(parseInput("")).toEqual({ cmd: "", args: [], raw: "" });
    expect(parseInput("   ")).toEqual({ cmd: "", args: [], raw: "" });
  });

  it("lowercases the cmd and preserves args case", () => {
    expect(parseInput("Echo Hello World")).toEqual({
      cmd: "echo", args: ["Hello", "World"], raw: "Echo Hello World",
    });
  });

  it("collapses internal whitespace in args", () => {
    expect(parseInput("echo a   b  c")).toEqual({
      cmd: "echo", args: ["a", "b", "c"], raw: "echo a   b  c",
    });
  });

  it("keeps multi-token commands that are actually cmd + args", () => {
    expect(parseInput("cat summary.md")).toEqual({
      cmd: "cat", args: ["summary.md"], raw: "cat summary.md",
    });
  });

  it("preserves the raw input verbatim (no trim) except for empty detection", () => {
    // raw includes whatever the caller passed (they typically trim first)
    expect(parseInput("cat summary.md").raw).toBe("cat summary.md");
  });
});

describe("dispatchCommand — existing commands", () => {
  it("empty cmd → null", () => {
    expect(dispatchCommand(parseInput(""), ctx)).toBeNull();
  });

  it("whoami → WhoamiBlock", () => {
    expect(dispatchCommand(parseInput("whoami"), ctx)).toEqual({ kind: "component", name: "WhoamiBlock" });
  });

  it("cat summary.md → text with resume summary", () => {
    expect(dispatchCommand(parseInput("cat summary.md"), ctx)).toEqual({ kind: "text", text: "fake summary" });
  });

  it("cat experience.md → ExperienceList", () => {
    expect(dispatchCommand(parseInput("cat experience.md"), ctx)).toEqual({ kind: "component", name: "ExperienceList" });
  });

  it("ls skills/ → SkillsGrid", () => {
    expect(dispatchCommand(parseInput("ls skills/"), ctx)).toEqual({ kind: "component", name: "SkillsGrid" });
  });

  it("cat education.md → EducationBlock", () => {
    expect(dispatchCommand(parseInput("cat education.md"), ctx)).toEqual({ kind: "component", name: "EducationBlock" });
  });

  it("contact → ContactBlock", () => {
    expect(dispatchCommand(parseInput("contact"), ctx)).toEqual({ kind: "component", name: "ContactBlock" });
  });

  it("help and ? → HelpBlock", () => {
    expect(dispatchCommand(parseInput("help"), ctx)).toEqual({ kind: "component", name: "HelpBlock" });
    expect(dispatchCommand(parseInput("?"), ctx)).toEqual({ kind: "component", name: "HelpBlock" });
  });

  it("clear → clear kind", () => {
    expect(dispatchCommand(parseInput("clear"), ctx)).toEqual({ kind: "clear" });
  });

  it("pdf → print kind (no direct window.print call)", () => {
    expect(dispatchCommand(parseInput("pdf"), ctx)).toEqual({ kind: "print" });
  });

  it("unknown → text (bash format comes in Task 6 — for now: old format)", () => {
    expect(dispatchCommand(parseInput("foobar"), ctx)).toEqual({
      kind: "text",
      text: "command not found: foobar. try 'help'.",
    });
  });

  it("accepts input in any case (cmd is normalized)", () => {
    expect(dispatchCommand(parseInput("CAT Summary.md"), ctx)).toEqual({ kind: "text", text: "fake summary" });
  });
});
```

- [ ] **Step 2: Run the tests to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: FAIL — `parseInput`/`DispatchContext` not exported, signature mismatch.

- [ ] **Step 3: Rewrite the dispatcher**

Overwrite `app/utils/resumeDispatcher.ts`:

```ts
import type { Resume } from "~/types/resume";

export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock";

export type OutputEntry =
  | { kind: "text"; text: string }
  | { kind: "component"; name: OutputComponentName; props?: Record<string, unknown> }
  | { kind: "clear" }
  | { kind: "navigate"; path: string }
  | { kind: "theme"; mode: "light" | "dark" }
  | { kind: "print" }
  | null;

export interface ProjectRef {
  slug: string;
  title: string;
  year: number;
  stack: string[];
  summary: string;
}

export interface PostRef {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface DispatchContext {
  resume: Resume;
  projects: ProjectRef[];
  posts: PostRef[];
  themeMode: "light" | "dark";
  prompt: { user: string };
}

export interface ParsedCommand {
  cmd: string;
  args: string[];
  raw: string;
}

export function parseInput(raw: string): ParsedCommand {
  const trimmed = raw.trim();
  if (trimmed === "") return { cmd: "", args: [], raw: "" };
  const tokens = trimmed.split(/\s+/);
  const [first, ...rest] = tokens;
  return { cmd: (first ?? "").toLowerCase(), args: rest, raw };
}

type Handler = (parsed: ParsedCommand, ctx: DispatchContext) => OutputEntry;

const handlers: Record<string, Handler> = {
  whoami: () => ({ kind: "component", name: "WhoamiBlock" }),
  contact: () => ({ kind: "component", name: "ContactBlock" }),
  help: () => ({ kind: "component", name: "HelpBlock" }),
  "?": () => ({ kind: "component", name: "HelpBlock" }),
  clear: () => ({ kind: "clear" }),
  pdf: () => ({ kind: "print" }),
  cat: (parsed, ctx) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "summary.md") return { kind: "text", text: ctx.resume.summary };
    if (path === "experience.md") return { kind: "component", name: "ExperienceList" };
    if (path === "education.md") return { kind: "component", name: "EducationBlock" };
    return unknown(parsed);
  },
  ls: (parsed) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "skills/") return { kind: "component", name: "SkillsGrid" };
    return unknown(parsed);
  },
};

function unknown(parsed: ParsedCommand): OutputEntry {
  return { kind: "text", text: `command not found: ${parsed.cmd || parsed.raw}. try 'help'.` };
}

export function dispatchCommand(parsed: ParsedCommand, ctx: DispatchContext): OutputEntry {
  if (parsed.cmd === "") return null;
  const handler = handlers[parsed.cmd];
  if (!handler) return unknown(parsed);
  return handler(parsed, ctx);
}
```

- [ ] **Step 4: Run the tests to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: all pass.

- [ ] **Step 5: Typecheck (will surface orchestrator breakage)**

Run: `pnpm nuxi typecheck` (or `pnpm build` if no typecheck script)

Expected: errors inside `ResumeTerminal.vue` and `ResumeEntry.vue` about the dispatcher signature / missing imports. **That's expected — Task 7 fixes ResumeTerminal and Task 20 fixes ResumeEntry.** Capture the list; don't try to fix yet.

- [ ] **Step 6: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Rewrite resume dispatcher with ParsedCommand and DispatchContext"
```

---

## Task 6: Bash-style unknown-command error

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Switch the unknown-command output to the canonical bash format, `bash: <cmd>: command not found`.

- [ ] **Step 1: Update the failing test**

In `tests/unit/resumeDispatcher.test.ts`, replace the existing "unknown" test with:

```ts
  it("unknown → bash-style 'command not found'", () => {
    expect(dispatchCommand(parseInput("foobar"), ctx)).toEqual({
      kind: "text",
      text: "bash: foobar: command not found",
    });
  });
```

- [ ] **Step 2: Run it to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: fail — text mismatch.

- [ ] **Step 3: Update `unknown()`**

In `app/utils/resumeDispatcher.ts`:

```ts
function unknown(parsed: ParsedCommand): OutputEntry {
  const name = parsed.cmd || parsed.raw.trim();
  return { kind: "text", text: `bash: ${name}: command not found` };
}
```

- [ ] **Step 4: Run the tests to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Use bash-style 'command not found' error"
```

---

## Task 7: Orchestrator — context assembly + new side effects

**Files:**
- Modify: `app/components/resume/ResumeTerminal.vue`

Port the orchestrator to the new dispatcher signature. Assemble the `DispatchContext` on mount (using `useResume`, `queryCollection` for work + writing, theme store, random username). Handle new side-effect kinds: `navigate`, `theme`, `print`. Track `history` (append every non-empty `parsed.raw` that produces a non-null output). ResumeEntry is still expecting the old shape — that's fixed in Task 20. For now, pass `output` through as before.

- [ ] **Step 1: Rewrite `<script setup>` in `ResumeTerminal.vue`**

Replace everything from the opening `<script setup lang="ts">` through the closing `</script>` with:

```vue
<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useMotionStore } from "~/stores/motion";
import { useThemeStore } from "~/stores/theme";
import { useRandomUsername } from "~/composables/useRandomUsername";
import {
  parseInput,
  dispatchCommand,
  type OutputEntry,
  type DispatchContext,
  type ProjectRef,
  type PostRef,
} from "~/utils/resumeDispatcher";
import ResumeBuffer from "./ResumeBuffer.vue";
import ResumeEntry from "./ResumeEntry.vue";
import ResumePrompt from "./ResumePrompt.vue";
import ResumeSidebar from "./ResumeSidebar.vue";

const resume = useResume();
const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const themeStore = useThemeStore();
const router = useRouter();

// Non-awaited useAsyncData: data starts null, populates reactively.
// Avoids top-level await so the terminal doesn't block the tree's Suspense.
const { data: projectsData } = useAsyncData("terminal-projects", () =>
  queryCollection("work").order("year", "DESC").all(),
);
const { data: postsData } = useAsyncData("terminal-posts", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all(),
);

const projects = computed<ProjectRef[]>(() =>
  (projectsData.value ?? []).map((p) => ({
    slug: p.stem.replace(/^work\//, ""),
    title: p.title,
    year: p.year,
    stack: p.stack,
    summary: p.summary,
  })),
);

const posts = computed<PostRef[]>(() =>
  (postsData.value ?? []).map((p) => ({
    slug: p.stem.replace(/^writing\//, ""),
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
  })),
);

const username = ref("user");

interface BufferEntry {
  id: string;
  input: string;
  output: OutputEntry;
}

const buffer = ref<BufferEntry[]>([]);
const history = ref<string[]>([]);
const input = ref("");
const promptRef = ref<InstanceType<typeof ResumePrompt> | null>(null);

let entryCounter = 0;
function nextId() {
  entryCounter += 1;
  return `entry-${entryCounter}`;
}

function buildContext(): DispatchContext | null {
  if (!resume.value) return null;
  return {
    resume: resume.value,
    projects: projects.value,
    posts: posts.value,
    themeMode: themeStore.mode,
    prompt: { user: username.value },
  };
}

async function typeInto(text: string, speed = 45) {
  if (reduced.value) {
    input.value = text;
    return;
  }
  input.value = "";
  for (let i = 0; i < text.length; i++) {
    input.value += text[i];
    await new Promise((r) => setTimeout(r, speed));
  }
}

function appendEntry(inputText: string, output: Exclude<OutputEntry, null>) {
  buffer.value = [...buffer.value, { id: nextId(), input: inputText, output }];
}

async function runCommand(cmd: string) {
  const ctx = buildContext();
  if (!ctx) return;

  const parsed = parseInput(cmd.trim());
  if (parsed.cmd === "") {
    input.value = "";
    return;
  }

  // History always gets the raw input (non-empty)
  history.value = [...history.value, parsed.raw];

  const output = dispatchCommand(parsed, ctx);

  if (output === null) {
    // no-op (shouldn't happen for non-empty input, but guard anyway)
  } else if (output.kind === "clear") {
    buffer.value = [];
  } else if (output.kind === "navigate") {
    router.push(output.path);
  } else if (output.kind === "theme") {
    themeStore.setMode(output.mode);
    appendEntry(parsed.raw, { kind: "text", text: `theme: ${output.mode}` });
  } else if (output.kind === "print") {
    if (typeof window !== "undefined") window.print();
  } else {
    appendEntry(parsed.raw, output);
  }

  input.value = "";
  await nextTick();
  promptRef.value?.focus();
}

function onSidebarRun(cmd: string) {
  typeInto(cmd).then(() => runCommand(cmd));
}

function onCandidates(candidates: string[]) {
  // Double-tab behavior: echo the candidates as a plain text entry, no input line
  appendEntry("", { kind: "text", text: candidates.join("  ") });
}

async function runIntro() {
  const introCmd = "whoami";
  await typeInto(introCmd);
  await new Promise((r) => setTimeout(r, reduced.value ? 0 : 150));
  await runCommand(introCmd);
}

const introRan = ref(false);

onMounted(() => {
  username.value = useRandomUsername() || "user";
});

watch(
  resume,
  (r) => {
    if (r && !introRan.value) {
      introRan.value = true;
      runIntro();
    }
  },
  { immediate: true }
);
</script>
```

- [ ] **Step 2: Update the `<template>` to pass history + username + candidates**

Replace the `<template>` block in `ResumeTerminal.vue` with:

```vue
<template>
  <div class="grid grid-cols-[240px_1fr] max-lg:grid-cols-1 gap-4 h-[calc(100vh-48px)] max-w-[1280px] mx-auto px-4 md:px-8">
    <ResumeSidebar class="max-lg:order-first" @run="onSidebarRun" />
    <div class="flex flex-col min-h-0 pt-6 pb-2">
      <ResumeBuffer :entry-count="buffer.length" @focus-input="() => promptRef?.focus()">
        <ResumeEntry v-for="entry in buffer" :key="entry.id" :input="entry.input" :output="entry.output" />
      </ResumeBuffer>
      <ResumePrompt
        ref="promptRef"
        v-model="input"
        :history="history"
        :username="username"
        :commands="['whoami','cat summary.md','cat experience.md','cat education.md','ls','ls skills/','ls projects/','ls writing/','contact','help','clear','pdf','date','uname','echo','sudo','exit','logout','theme','grep']"
        :project-slugs="projects.map((p) => p.slug)"
        :post-slugs="posts.map((p) => p.slug)"
        @submit="runCommand"
        @candidates="onCandidates"
      />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run unit tests**

Run: `pnpm test:unit`
Expected: all unit tests still pass (the dispatcher tests don't touch the orchestrator).

- [ ] **Step 4: Start the dev server and smoke-test**

Run: `pnpm dev` and open http://localhost:3000/resume.
Expected: terminal loads, intro `whoami` runs, `help` still shows the old HelpBlock, `cat summary.md` still works, `pdf` opens print dialog. The new prompt template hasn't been wired yet — still shows `$`. That's fine; Task 23 redesigns the template.

Kill the dev server.

- [ ] **Step 5: Commit**

```bash
git add app/components/resume/ResumeTerminal.vue
git commit -m "Port ResumeTerminal orchestrator to new dispatcher signature and side-effect kinds"
```

---

## Task 8: Flavor commands — `date`, `uname`, `uname -a`

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Three small handlers.

- [ ] **Step 1: Write failing tests**

Append to the "dispatchCommand — existing commands" `describe` block (or a new block) in `tests/unit/resumeDispatcher.test.ts`:

```ts
describe("dispatchCommand — flavor commands", () => {
  it("date returns a text entry formatted en-US", () => {
    const r = dispatchCommand(parseInput("date"), ctx);
    expect(r?.kind).toBe("text");
    // Match something like "Sun, Apr 19, 2026"
    if (r?.kind === "text") {
      expect(r.text).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    }
  });

  it("uname returns 'digitalseraph'", () => {
    expect(dispatchCommand(parseInput("uname"), ctx)).toEqual({ kind: "text", text: "digitalseraph" });
  });

  it("uname -a returns the full build string", () => {
    expect(dispatchCommand(parseInput("uname -a"), ctx)).toEqual({
      kind: "text",
      text: "digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)",
    });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: fail — `date`/`uname` hit `unknown` handler.

- [ ] **Step 3: Add handlers**

In `app/utils/resumeDispatcher.ts`, add to the `handlers` object:

```ts
  date: () => ({
    kind: "text",
    text: new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    }),
  }),
  uname: (parsed) => {
    if (parsed.args[0] === "-a") {
      return { kind: "text", text: "digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)" };
    }
    return { kind: "text", text: "digitalseraph" };
  },
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add date and uname commands"
```

---

## Task 9: `echo` command (with XSS-safety test)

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

`echo` joins `args` with a single space. The XSS test asserts the output `kind` is `text` so downstream rendering goes through Vue interpolation.

- [ ] **Step 1: Write failing tests**

Append to `tests/unit/resumeDispatcher.test.ts`:

```ts
describe("dispatchCommand — echo", () => {
  it("echo joins args with a single space", () => {
    expect(dispatchCommand(parseInput("echo hello world"), ctx)).toEqual({
      kind: "text", text: "hello world",
    });
  });

  it("echo preserves the case of args", () => {
    expect(dispatchCommand(parseInput("echo Hello World"), ctx)).toEqual({
      kind: "text", text: "Hello World",
    });
  });

  it("echo with no args returns an empty text entry", () => {
    expect(dispatchCommand(parseInput("echo"), ctx)).toEqual({
      kind: "text", text: "",
    });
  });

  it("echo output kind is 'text' even when args contain HTML (XSS guard)", () => {
    const r = dispatchCommand(parseInput("echo <script>alert(1)</script>"), ctx);
    expect(r?.kind).toBe("text");
    if (r?.kind === "text") {
      expect(r.text).toContain("<script>");
    }
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add the handler**

In `handlers`:

```ts
  echo: (parsed) => ({ kind: "text", text: parsed.args.join(" ") }),
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add echo command"
```

---

## Task 10: `sudo` command

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Uses `ctx.prompt.user` in the message body. Two-space gap matches real sudo output.

- [ ] **Step 1: Write failing test**

Append:

```ts
describe("dispatchCommand — sudo", () => {
  it("sudo returns the canonical 'not in sudoers' message with the user's name", () => {
    expect(dispatchCommand(parseInput("sudo reboot"), ctx)).toEqual({
      kind: "text",
      text: "user12345 is not in the sudoers file.  This incident will be reported.",
    });
  });

  it("sudo with no args still renders the message", () => {
    expect(dispatchCommand(parseInput("sudo"), ctx)).toEqual({
      kind: "text",
      text: "user12345 is not in the sudoers file.  This incident will be reported.",
    });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add the handler**

In `handlers`:

```ts
  sudo: (_parsed, ctx) => ({
    kind: "text",
    text: `${ctx.prompt.user} is not in the sudoers file.  This incident will be reported.`,
  }),
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add sudo command"
```

---

## Task 11: `exit` / `logout` commands

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Both return `{ kind: "navigate", path: "/" }`.

- [ ] **Step 1: Write failing test**

Append:

```ts
describe("dispatchCommand — exit/logout", () => {
  it("exit returns navigate to /", () => {
    expect(dispatchCommand(parseInput("exit"), ctx)).toEqual({ kind: "navigate", path: "/" });
  });
  it("logout returns navigate to /", () => {
    expect(dispatchCommand(parseInput("logout"), ctx)).toEqual({ kind: "navigate", path: "/" });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add handlers**

```ts
  exit: () => ({ kind: "navigate", path: "/" }),
  logout: () => ({ kind: "navigate", path: "/" }),
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add exit and logout commands"
```

---

## Task 12: `theme` command

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

No args → text describing the current mode. `light`/`dark` → theme kind. Anything else → invalid-mode text.

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("dispatchCommand — theme", () => {
  it("theme with no args returns current mode text", () => {
    expect(dispatchCommand(parseInput("theme"), ctx)).toEqual({
      kind: "text", text: "current theme: dark",
    });
  });

  it("theme light returns theme kind with mode=light", () => {
    expect(dispatchCommand(parseInput("theme light"), ctx)).toEqual({ kind: "theme", mode: "light" });
  });

  it("theme dark returns theme kind with mode=dark", () => {
    expect(dispatchCommand(parseInput("theme dark"), ctx)).toEqual({ kind: "theme", mode: "dark" });
  });

  it("theme <bogus> returns an invalid-mode text entry", () => {
    expect(dispatchCommand(parseInput("theme neon"), ctx)).toEqual({
      kind: "text",
      text: "theme: invalid mode 'neon'. valid modes: light, dark",
    });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add the handler**

```ts
  theme: (parsed, ctx) => {
    const arg = (parsed.args[0] ?? "").toLowerCase();
    if (arg === "") return { kind: "text", text: `current theme: ${ctx.themeMode}` };
    if (arg === "light" || arg === "dark") return { kind: "theme", mode: arg };
    return { kind: "text", text: `theme: invalid mode '${arg}'. valid modes: light, dark` };
  },
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Smoke-test in browser**

Run: `pnpm dev` → /resume → type `theme light` → page flips to light theme. `theme dark` → back to dark. `theme` → echoes `current theme: dark`. Kill server.

- [ ] **Step 6: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add theme command"
```

---

## Task 13: `DirectoryListing.vue` component + register in `outputMap`

**Files:**
- Create: `app/components/resume/outputs/DirectoryListing.vue`
- Modify: `app/components/resume/ResumeEntry.vue`
- Modify: `app/utils/resumeDispatcher.ts` — add `"DirectoryListing"` to `OutputComponentName`

This is also where `ResumeEntry` learns to pass `output.props` through. Without this, subsequent component-with-props tasks can't work.

- [ ] **Step 1: Add `"DirectoryListing"` to the `OutputComponentName` union**

In `app/utils/resumeDispatcher.ts`:

```ts
export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock"
  | "DirectoryListing";
```

- [ ] **Step 2: Create `DirectoryListing.vue`**

Create `app/components/resume/outputs/DirectoryListing.vue`:

```vue
<script setup lang="ts">
interface DirEntry {
  name: string;
  kind: "file" | "dir";
  link?: string;
}

defineProps<{ items: DirEntry[] }>();
</script>

<template>
  <div class="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
    <template v-for="item in items" :key="item.name">
      <NuxtLink
        v-if="item.link"
        :to="item.link"
        class="hover:underline"
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}{{ item.kind === 'dir' ? '/' : '' }}</NuxtLink>
      <span
        v-else
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}{{ item.kind === 'dir' ? '/' : '' }}</span>
    </template>
  </div>
</template>
```

- [ ] **Step 3: Update `ResumeEntry.vue` to register the component and pass props**

Replace `app/components/resume/ResumeEntry.vue` with:

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import WhoamiBlock from "./outputs/WhoamiBlock.vue";
import ExperienceList from "./outputs/ExperienceList.vue";
import SkillsGrid from "./outputs/SkillsGrid.vue";
import EducationBlock from "./outputs/EducationBlock.vue";
import ContactBlock from "./outputs/ContactBlock.vue";
import HelpBlock from "./outputs/HelpBlock.vue";
import DirectoryListing from "./outputs/DirectoryListing.vue";
import type { OutputComponentName, OutputEntry } from "~/utils/resumeDispatcher";

const props = defineProps<{
  input: string;
  output: OutputEntry;
}>();

const outputMap: Record<OutputComponentName, Component> = {
  WhoamiBlock,
  ExperienceList,
  SkillsGrid,
  EducationBlock,
  ContactBlock,
  HelpBlock,
  DirectoryListing,
};

const component = computed(() =>
  props.output?.kind === "component" ? outputMap[props.output.name] ?? null : null
);

const componentProps = computed(() =>
  props.output?.kind === "component" ? (props.output.props ?? {}) : {}
);
</script>

<template>
  <div class="mb-4">
    <div v-if="input" class="flex items-baseline gap-2 mb-2">
      <span class="text-[var(--accent)] select-none">$</span>
      <span class="text-[var(--text)]">{{ input }}</span>
    </div>
    <div class="pl-[22px] text-[var(--text-muted)]">
      <template v-if="output?.kind === 'text'">
        <span class="whitespace-pre-wrap">{{ output.text }}</span>
      </template>
      <component v-else-if="component" :is="component" v-bind="componentProps" />
    </div>
  </div>
</template>
```

(The `v-if="input"` guard on the prompt line lets us render a headless entry — used by the Tab double-press candidate list.)

- [ ] **Step 4: Confirm unit tests still pass**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: pass (nothing changed in test expectations).

- [ ] **Step 5: Commit**

```bash
git add app/components/resume/outputs/DirectoryListing.vue app/components/resume/ResumeEntry.vue app/utils/resumeDispatcher.ts
git commit -m "Add DirectoryListing component and pass props through ResumeEntry"
```

---

## Task 14: `ls` (no args) dispatcher handler

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

`ls` with no args returns a `DirectoryListing` component populated with the 7 top-level entries.

- [ ] **Step 1: Write failing test**

Append:

```ts
describe("dispatchCommand — ls (no args)", () => {
  it("returns a DirectoryListing with 7 items (4 files + 3 dirs)", () => {
    const r = dispatchCommand(parseInput("ls"), ctx);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("DirectoryListing");
      const items = (r.props as { items: Array<{ name: string; kind: string }> }).items;
      expect(items.map((i) => i.name)).toEqual([
        "summary.md", "experience.md", "education.md", "contact",
        "skills/", "projects/", "writing/",
      ]);
      expect(items.filter((i) => i.kind === "file").length).toBe(4);
      expect(items.filter((i) => i.kind === "dir").length).toBe(3);
    }
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`
Expected: fail — `ls` with no args hits `unknown`.

- [ ] **Step 3: Update the `ls` handler**

Replace the existing `ls` handler in `app/utils/resumeDispatcher.ts` with:

```ts
  ls: (parsed) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: [
            { name: "summary.md", kind: "file" },
            { name: "experience.md", kind: "file" },
            { name: "education.md", kind: "file" },
            { name: "contact", kind: "file" },
            { name: "skills/", kind: "dir" },
            { name: "projects/", kind: "dir" },
            { name: "writing/", kind: "dir" },
          ],
        },
      };
    }
    if (path === "skills/") return { kind: "component", name: "SkillsGrid" };
    return unknown(parsed);
  },
```

Note: the `name` already includes the trailing `/` for dirs (the component doesn't add it — matches what the test expects).

- [ ] **Step 4: Also update `DirectoryListing.vue` to stop adding `/` since names include it**

Simplify `app/components/resume/outputs/DirectoryListing.vue`:

```vue
<script setup lang="ts">
interface DirEntry {
  name: string;
  kind: "file" | "dir";
  link?: string;
}

defineProps<{ items: DirEntry[] }>();
</script>

<template>
  <div class="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
    <template v-for="item in items" :key="item.name">
      <NuxtLink
        v-if="item.link"
        :to="item.link"
        class="hover:underline"
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}</NuxtLink>
      <span
        v-else
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}</span>
    </template>
  </div>
</template>
```

- [ ] **Step 5: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 6: Commit**

```bash
git add app/utils/resumeDispatcher.ts app/components/resume/outputs/DirectoryListing.vue tests/unit/resumeDispatcher.test.ts
git commit -m "Add ls (no-args) command"
```

---

## Task 15: `ls projects/` and `ls writing/`

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Derive items from `ctx.projects` / `ctx.posts`. Names are `<slug>.md`, `link` is `/work/<slug>` or `/writing/<slug>`.

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("dispatchCommand — ls projects/ and ls writing/", () => {
  const withContent: DispatchContext = {
    ...ctx,
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: ["Vue 3"], summary: "jump summary" },
      { slug: "02-thrivee", title: "Thrivee", year: 2019, stack: [], summary: "thrivee summary" },
    ],
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "hello there" },
    ],
  };

  it("ls projects/ returns files named <slug>.md linking to /work/<slug>", () => {
    const r = dispatchCommand(parseInput("ls projects/"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("DirectoryListing");
      const items = (r.props as { items: Array<{ name: string; kind: string; link?: string }> }).items;
      expect(items).toEqual([
        { name: "01-jump.md", kind: "file", link: "/work/01-jump" },
        { name: "02-thrivee.md", kind: "file", link: "/work/02-thrivee" },
      ]);
    }
  });

  it("ls writing/ returns files named <slug>.md linking to /writing/<slug>", () => {
    const r = dispatchCommand(parseInput("ls writing/"), withContent);
    if (r?.kind === "component") {
      const items = (r.props as { items: Array<{ name: string; kind: string; link?: string }> }).items;
      expect(items).toEqual([
        { name: "hello-world.md", kind: "file", link: "/writing/hello-world" },
      ]);
    }
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Update the `ls` handler**

Replace the `ls` handler with:

```ts
  ls: (parsed, ctx) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: [
            { name: "summary.md", kind: "file" },
            { name: "experience.md", kind: "file" },
            { name: "education.md", kind: "file" },
            { name: "contact", kind: "file" },
            { name: "skills/", kind: "dir" },
            { name: "projects/", kind: "dir" },
            { name: "writing/", kind: "dir" },
          ],
        },
      };
    }
    if (path === "skills/") return { kind: "component", name: "SkillsGrid" };
    if (path === "projects/") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: ctx.projects.map((p) => ({
            name: `${p.slug}.md`,
            kind: "file",
            link: `/work/${p.slug}`,
          })),
        },
      };
    }
    if (path === "writing/") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: ctx.posts.map((p) => ({
            name: `${p.slug}.md`,
            kind: "file",
            link: `/writing/${p.slug}`,
          })),
        },
      };
    }
    return unknown(parsed);
  },
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add ls projects/ and ls writing/ commands"
```

---

## Task 16: `ProjectPreview.vue` component + register

**Files:**
- Create: `app/components/resume/outputs/ProjectPreview.vue`
- Modify: `app/utils/resumeDispatcher.ts` — add `"ProjectPreview"` to union
- Modify: `app/components/resume/ResumeEntry.vue` — register

- [ ] **Step 1: Add `"ProjectPreview"` to the `OutputComponentName` union**

In `app/utils/resumeDispatcher.ts`:

```ts
export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock"
  | "DirectoryListing"
  | "ProjectPreview";
```

- [ ] **Step 2: Create `ProjectPreview.vue`**

Create `app/components/resume/outputs/ProjectPreview.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{ slug: string }>();

const { data: project } = await useAsyncData(
  () => `terminal-project-${props.slug}`,
  () => queryCollection("work").where("stem", "=", `work/${props.slug}`).first(),
);
</script>

<template>
  <div v-if="project" class="space-y-2">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 class="text-[var(--text)] font-semibold">{{ project.title }}</h3>
      <span class="text-[var(--text-dim)] text-sm">{{ project.role }} · {{ project.year }}</span>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="item in project.stack"
        :key="item"
        class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs"
      >{{ item }}</span>
    </div>
    <p class="text-[var(--text-muted)]">{{ project.summary }}</p>
    <NuxtLink :to="`/work/${slug}`" class="inline-block text-[var(--accent)] hover:underline">
      read case study →
    </NuxtLink>
  </div>
  <div v-else class="text-[var(--text-dim)]">cat: projects/{{ slug }}.md: No such file or directory</div>
</template>
```

- [ ] **Step 3: Register in `ResumeEntry.vue`**

Add the import and map entry to `app/components/resume/ResumeEntry.vue`:

```ts
import ProjectPreview from "./outputs/ProjectPreview.vue";
```

And in the `outputMap`:

```ts
  ProjectPreview,
```

- [ ] **Step 4: Confirm unit tests still pass**

Run: `pnpm test:unit`

- [ ] **Step 5: Commit**

```bash
git add app/components/resume/outputs/ProjectPreview.vue app/components/resume/ResumeEntry.vue app/utils/resumeDispatcher.ts
git commit -m "Add ProjectPreview component"
```

---

## Task 17: `cat projects/<slug>.md` command

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Valid slug → `ProjectPreview` component. Unknown slug → bash-style "No such file or directory" text.

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("dispatchCommand — cat projects/<slug>.md", () => {
  const withProjects: DispatchContext = {
    ...ctx,
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: [], summary: "" },
    ],
  };

  it("known slug returns ProjectPreview with slug prop", () => {
    expect(dispatchCommand(parseInput("cat projects/01-jump.md"), withProjects)).toEqual({
      kind: "component",
      name: "ProjectPreview",
      props: { slug: "01-jump" },
    });
  });

  it("unknown slug returns bash-style 'No such file or directory'", () => {
    expect(dispatchCommand(parseInput("cat projects/bogus.md"), withProjects)).toEqual({
      kind: "text",
      text: "cat: projects/bogus.md: No such file or directory",
    });
  });

  it("missing .md extension is treated as not found", () => {
    expect(dispatchCommand(parseInput("cat projects/01-jump"), withProjects)).toEqual({
      kind: "text",
      text: "cat: projects/01-jump: No such file or directory",
    });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Update the `cat` handler**

Replace the `cat` handler in `app/utils/resumeDispatcher.ts` with:

```ts
  cat: (parsed, ctx) => {
    const rawPath = parsed.args[0] ?? "";
    const path = rawPath.toLowerCase();
    if (path === "summary.md") return { kind: "text", text: ctx.resume.summary };
    if (path === "experience.md") return { kind: "component", name: "ExperienceList" };
    if (path === "education.md") return { kind: "component", name: "EducationBlock" };

    const projectsMatch = /^projects\/(.+)\.md$/.exec(path);
    if (projectsMatch) {
      const slug = projectsMatch[1]!;
      const found = ctx.projects.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "component", name: "ProjectPreview", props: { slug: found.slug } };
      return { kind: "text", text: `cat: projects/${slug}.md: No such file or directory` };
    }

    if (path.startsWith("projects/")) {
      return { kind: "text", text: `cat: ${rawPath}: No such file or directory` };
    }

    return unknown(parsed);
  },
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add cat projects/<slug>.md command"
```

---

## Task 18: `PostPreview.vue` component + register

**Files:**
- Create: `app/components/resume/outputs/PostPreview.vue`
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `app/components/resume/ResumeEntry.vue`

- [ ] **Step 1: Add `"PostPreview"` to the `OutputComponentName` union**

In `app/utils/resumeDispatcher.ts`:

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
  | "PostPreview";
```

- [ ] **Step 2: Create `PostPreview.vue`**

Create `app/components/resume/outputs/PostPreview.vue`:

```vue
<script setup lang="ts">
const props = defineProps<{ slug: string }>();

const { data: post } = await useAsyncData(
  () => `terminal-post-${props.slug}`,
  () => queryCollection("writing").where("stem", "=", `writing/${props.slug}`).first(),
);
</script>

<template>
  <div v-if="post" class="space-y-2">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 class="text-[var(--text)] font-semibold">{{ post.title }}</h3>
      <span class="text-[var(--text-dim)] text-sm">{{ post.date }}</span>
    </div>
    <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs"
      >{{ tag }}</span>
    </div>
    <p class="text-[var(--text-muted)]">{{ post.excerpt }}</p>
    <NuxtLink :to="`/writing/${slug}`" class="inline-block text-[var(--accent)] hover:underline">
      read post →
    </NuxtLink>
  </div>
  <div v-else class="text-[var(--text-dim)]">cat: writing/{{ slug }}.md: No such file or directory</div>
</template>
```

- [ ] **Step 3: Register in `ResumeEntry.vue`**

Add the import:

```ts
import PostPreview from "./outputs/PostPreview.vue";
```

And in `outputMap`:

```ts
  PostPreview,
```

- [ ] **Step 4: Confirm unit tests still pass**

Run: `pnpm test:unit`

- [ ] **Step 5: Commit**

```bash
git add app/components/resume/outputs/PostPreview.vue app/components/resume/ResumeEntry.vue app/utils/resumeDispatcher.ts
git commit -m "Add PostPreview component"
```

---

## Task 19: `cat writing/<slug>.md` command

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("dispatchCommand — cat writing/<slug>.md", () => {
  const withPosts: DispatchContext = {
    ...ctx,
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "" },
    ],
  };

  it("known slug returns PostPreview", () => {
    expect(dispatchCommand(parseInput("cat writing/hello-world.md"), withPosts)).toEqual({
      kind: "component",
      name: "PostPreview",
      props: { slug: "hello-world" },
    });
  });

  it("unknown slug returns 'No such file or directory'", () => {
    expect(dispatchCommand(parseInput("cat writing/bogus.md"), withPosts)).toEqual({
      kind: "text",
      text: "cat: writing/bogus.md: No such file or directory",
    });
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add writing branch to `cat` handler**

In `app/utils/resumeDispatcher.ts`, inside the `cat` handler, add **before** the final `return unknown(parsed)`:

```ts
    const writingMatch = /^writing\/(.+)\.md$/.exec(path);
    if (writingMatch) {
      const slug = writingMatch[1]!;
      const found = ctx.posts.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "component", name: "PostPreview", props: { slug: found.slug } };
      return { kind: "text", text: `cat: writing/${slug}.md: No such file or directory` };
    }

    if (path.startsWith("writing/")) {
      return { kind: "text", text: `cat: ${rawPath}: No such file or directory` };
    }
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add cat writing/<slug>.md command"
```

---

## Task 20: `GrepResults.vue` component + register

**Files:**
- Create: `app/components/resume/outputs/GrepResults.vue`
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `app/components/resume/ResumeEntry.vue`

- [ ] **Step 1: Add `"GrepResults"` to the `OutputComponentName` union**

In `app/utils/resumeDispatcher.ts`:

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

- [ ] **Step 2: Also export `GrepMatch` type**

In `app/utils/resumeDispatcher.ts`:

```ts
export interface GrepMatch {
  source: string;
  snippet: string;
  link?: string;
}
```

- [ ] **Step 3: Create `GrepResults.vue`**

Create `app/components/resume/outputs/GrepResults.vue`:

```vue
<script setup lang="ts">
interface GrepMatch {
  source: string;
  snippet: string;
  link?: string;
}

const props = defineProps<{ term: string; matches: GrepMatch[] }>();

// Split the snippet around the term for <mark> highlighting, case-insensitive.
function parts(snippet: string): Array<{ text: string; hit: boolean }> {
  if (!props.term) return [{ text: snippet, hit: false }];
  const regex = new RegExp(`(${props.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return snippet.split(regex).map((seg, i) => ({ text: seg, hit: i % 2 === 1 }));
}
</script>

<template>
  <div v-if="matches.length === 0" class="text-[var(--text-dim)]">(no matches)</div>
  <div v-else class="space-y-1 font-mono text-sm">
    <div v-for="(m, i) in matches" :key="i" class="flex gap-3">
      <code class="text-[var(--text-dim)] min-w-[200px]">{{ m.source }}</code>
      <NuxtLink v-if="m.link" :to="m.link" class="text-[var(--text-muted)] hover:underline">
        <template v-for="(p, pi) in parts(m.snippet)" :key="pi">
          <mark v-if="p.hit" class="bg-transparent text-[var(--accent)]">{{ p.text }}</mark>
          <span v-else>{{ p.text }}</span>
        </template>
      </NuxtLink>
      <span v-else class="text-[var(--text-muted)]">
        <template v-for="(p, pi) in parts(m.snippet)" :key="pi">
          <mark v-if="p.hit" class="bg-transparent text-[var(--accent)]">{{ p.text }}</mark>
          <span v-else>{{ p.text }}</span>
        </template>
      </span>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Register in `ResumeEntry.vue`**

Add import:

```ts
import GrepResults from "./outputs/GrepResults.vue";
```

And in `outputMap`:

```ts
  GrepResults,
```

- [ ] **Step 5: Confirm unit tests still pass**

Run: `pnpm test:unit`

- [ ] **Step 6: Commit**

```bash
git add app/components/resume/outputs/GrepResults.vue app/components/resume/ResumeEntry.vue app/utils/resumeDispatcher.ts
git commit -m "Add GrepResults component"
```

---

## Task 21: `grep <term>` command

**Files:**
- Modify: `app/utils/resumeDispatcher.ts`
- Modify: `tests/unit/resumeDispatcher.test.ts`

Case-insensitive substring search across: experience bullets, skill items, project titles+summaries, post titles+excerpts. No-args → usage text.

- [ ] **Step 1: Write failing tests**

Append:

```ts
describe("dispatchCommand — grep", () => {
  const withContent: DispatchContext = {
    ...ctx,
    resume: {
      ...resume,
      experience: [
        {
          role: "Dev", company: "Cox", location: "Atlanta",
          start: "2021-05", end: "present",
          bullets: ["Led the Vue 3 migration"],
          tech: [],
        },
      ],
      skills: [{ group: "Languages", items: ["TypeScript", "PHP"] }],
    },
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: ["Vue 3"], summary: "URL shortener" },
    ],
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "about Vue" },
    ],
  };

  it("grep with no args returns usage text", () => {
    expect(dispatchCommand(parseInput("grep"), withContent)).toEqual({
      kind: "text",
      text: "grep: missing search term. usage: grep <term>",
    });
  });

  it("grep with no matches returns GrepResults with empty matches", () => {
    const r = dispatchCommand(parseInput("grep zzz-nothing"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("GrepResults");
      const props = r.props as { term: string; matches: unknown[] };
      expect(props.term).toBe("zzz-nothing");
      expect(props.matches).toEqual([]);
    }
  });

  it("grep matches across experience bullets, skills, projects, and posts", () => {
    const r = dispatchCommand(parseInput("grep Vue"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      const { matches } = r.props as {
        matches: Array<{ source: string; snippet: string; link?: string }>;
      };
      // Order: experience → skills → projects → posts. Case-insensitive contains.
      expect(matches.map((m) => m.source)).toEqual([
        "experience/Cox/0",
        "projects/01-jump",
        "writing/hello-world",
      ]);
      // Project link + post link
      expect(matches.find((m) => m.source === "projects/01-jump")?.link).toBe("/work/01-jump");
      expect(matches.find((m) => m.source === "writing/hello-world")?.link).toBe("/writing/hello-world");
    }
  });

  it("grep is case-insensitive", () => {
    const r = dispatchCommand(parseInput("grep vue"), withContent);
    if (r?.kind === "component") {
      const { matches } = r.props as { matches: Array<{ source: string }> };
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it("grep joins multiple args into a single term", () => {
    const r = dispatchCommand(parseInput("grep URL shortener"), withContent);
    if (r?.kind === "component") {
      const { term, matches } = r.props as {
        term: string;
        matches: Array<{ source: string }>;
      };
      expect(term).toBe("URL shortener");
      expect(matches.some((m) => m.source === "projects/01-jump")).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 3: Add the `grep` handler**

In `app/utils/resumeDispatcher.ts`, add to `handlers`:

```ts
  grep: (parsed, ctx) => {
    const term = parsed.args.join(" ");
    if (term === "") {
      return { kind: "text", text: "grep: missing search term. usage: grep <term>" };
    }
    const needle = term.toLowerCase();
    const matches: GrepMatch[] = [];

    for (const role of ctx.resume.experience) {
      role.bullets.forEach((bullet, i) => {
        if (bullet.toLowerCase().includes(needle)) {
          matches.push({ source: `experience/${role.company}/${i}`, snippet: bullet });
        }
      });
    }

    for (const group of ctx.resume.skills) {
      for (const item of group.items) {
        if (item.toLowerCase().includes(needle)) {
          matches.push({ source: `skills/${group.group}/${item}`, snippet: item });
        }
      }
    }

    for (const p of ctx.projects) {
      if (p.title.toLowerCase().includes(needle) || p.summary.toLowerCase().includes(needle)) {
        matches.push({
          source: `projects/${p.slug}`,
          snippet: `${p.title} — ${p.summary}`,
          link: `/work/${p.slug}`,
        });
      }
    }

    for (const p of ctx.posts) {
      if (p.title.toLowerCase().includes(needle) || p.excerpt.toLowerCase().includes(needle)) {
        matches.push({
          source: `writing/${p.slug}`,
          snippet: `${p.title} — ${p.excerpt}`,
          link: `/writing/${p.slug}`,
        });
      }
    }

    return { kind: "component", name: "GrepResults", props: { term, matches } };
  },
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- resumeDispatcher`

- [ ] **Step 5: Smoke-test in browser**

Run: `pnpm dev` → /resume → type `grep Vue` → should see GrepResults with matches + highlighted term. Kill server.

- [ ] **Step 6: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "Add grep command"
```

---

## Task 22: Update `HelpBlock.vue` with new layout

**Files:**
- Modify: `app/components/resume/outputs/HelpBlock.vue`

Three labeled sections: `sections`, `filesystem`, `shell`. ~20 rows total.

- [ ] **Step 1: Rewrite `HelpBlock.vue`**

Replace `app/components/resume/outputs/HelpBlock.vue` with:

```vue
<script setup lang="ts">
interface HelpRow { cmd: string; hint: string; }
interface HelpGroup { label: string; rows: HelpRow[]; }

const groups: HelpGroup[] = [
  {
    label: "sections",
    rows: [
      { cmd: "whoami", hint: "identity" },
      { cmd: "cat summary.md", hint: "professional summary" },
      { cmd: "cat experience.md", hint: "full work history" },
      { cmd: "ls skills/", hint: "skills grouped by category" },
      { cmd: "cat education.md", hint: "education + certifications" },
      { cmd: "contact", hint: "email + github + linkedin" },
    ],
  },
  {
    label: "filesystem",
    rows: [
      { cmd: "ls", hint: "list top-level entries" },
      { cmd: "ls projects/", hint: "list project case studies" },
      { cmd: "ls writing/", hint: "list blog posts" },
      { cmd: "cat projects/<slug>.md", hint: "preview a project" },
      { cmd: "cat writing/<slug>.md", hint: "preview a post" },
      { cmd: "grep <term>", hint: "search across résumé + content" },
    ],
  },
  {
    label: "shell",
    rows: [
      { cmd: "date", hint: "current date" },
      { cmd: "uname [-a]", hint: "system info" },
      { cmd: "echo <text>", hint: "print text" },
      { cmd: "sudo", hint: "please no" },
      { cmd: "theme [light|dark]", hint: "show or set theme" },
      { cmd: "exit, logout", hint: "leave the terminal" },
      { cmd: "clear", hint: "wipe the buffer" },
      { cmd: "help, ?", hint: "this list" },
      { cmd: "pdf", hint: "open Save-as-PDF dialog" },
    ],
  },
];
</script>

<template>
  <div class="space-y-3">
    <div v-for="group in groups" :key="group.label">
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1">-- {{ group.label }} --</div>
      <div class="space-y-0.5">
        <div v-for="row in group.rows" :key="row.cmd" class="flex gap-3">
          <code class="text-[var(--accent)] min-w-[200px]">{{ row.cmd }}</code>
          <span class="text-[var(--text-muted)]">{{ row.hint }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Smoke-test**

Run: `pnpm dev` → /resume → type `help` → three sections visible. Kill server.

- [ ] **Step 3: Commit**

```bash
git add app/components/resume/outputs/HelpBlock.vue
git commit -m "Expand HelpBlock with sections/filesystem/shell groups"
```

---

## Task 23: ResumePrompt — template redesign + username prop

**Files:**
- Modify: `app/components/resume/ResumePrompt.vue`

Replace the bare `$` prompt with `user<rand>@digitalseraph:~$`. Accept `username`, `history`, `commands`, `projectSlugs`, `postSlugs` props. Emit `candidates` event. Keyboard wiring comes in Task 24 & 25.

- [ ] **Step 1: Rewrite `ResumePrompt.vue`**

Replace `app/components/resume/ResumePrompt.vue` with:

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  username?: string;
  history?: string[];
  commands?: string[];
  projectSlugs?: string[];
  postSlugs?: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "submit", v: string): void;
  (e: "candidates", v: string[]): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);

function focus() {
  inputEl.value?.focus();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    emit("submit", props.modelValue);
  }
}

onMounted(focus);
watch(() => props.disabled, (d) => { if (!d) focus(); });

defineExpose({ focus });
</script>

<template>
  <div class="flex items-center gap-2 font-mono text-[var(--text-mono-l)] border-t border-[var(--line)] pt-3">
    <span class="font-mono text-[var(--accent)] select-none">{{ username || "user" }}</span>
    <span class="font-mono text-[var(--text-muted)] select-none">@digitalseraph</span>
    <span class="font-mono text-[var(--text-dim)] select-none">:</span>
    <span class="font-mono text-[var(--text-muted)] select-none">~</span>
    <span class="font-mono text-[var(--accent)] select-none">$</span>
    <input
      ref="inputEl"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onKey"
      :disabled="disabled"
      type="text"
      autocomplete="off"
      spellcheck="false"
      class="flex-1 bg-transparent outline-none text-[var(--text)] caret-transparent disabled:opacity-50"
      aria-label="Resume terminal prompt — type a command and press Enter"
    />
    <span
      v-if="!disabled"
      class="inline-block w-[7px] h-[14px] bg-[var(--accent)] cursor-blink align-[-2px]"
      aria-hidden="true"
    ></span>
  </div>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
@media (prefers-reduced-motion: reduce) {
  .cursor-blink { animation: none; opacity: 1; }
}
</style>
```

- [ ] **Step 2: Smoke-test**

Run: `pnpm dev` → /resume → prompt reads `userNNNNN@digitalseraph:~$`. Refresh → same `NNNNN` (sessionStorage). New tab → different `NNNNN`. Kill server.

- [ ] **Step 3: Commit**

```bash
git add app/components/resume/ResumePrompt.vue
git commit -m "Redesign ResumePrompt with user@host prompt"
```

---

## Task 24: ResumePrompt — ↑/↓ history navigation

**Files:**
- Modify: `app/components/resume/ResumePrompt.vue`
- Create: `tests/component/ResumePrompt.test.ts`

- [ ] **Step 1: Write failing component tests**

Create `tests/component/ResumePrompt.test.ts`:

```ts
// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ResumePrompt from "~/components/resume/ResumePrompt.vue";

describe("ResumePrompt — history navigation", () => {
  it("ArrowUp recalls the most recent history entry", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        username: "user00001",
        history: ["whoami", "help", "contact"],
        commands: [],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("contact");
  });

  it("ArrowUp twice walks further back into history", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        history: ["whoami", "help", "contact"],
        commands: [], projectSlugs: [], postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("help");
  });

  it("ArrowDown past newest clears the input", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        history: ["whoami"],
        commands: [], projectSlugs: [], postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("whoami");
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(current).toBe("");
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- ResumePrompt`
Expected: fail — no ArrowUp handling.

- [ ] **Step 3: Wire history navigation into the prompt**

In `app/components/resume/ResumePrompt.vue`, update the `<script setup>` block:

Add at the top of the imports:

```ts
import { ref, onMounted, watch, toRef } from "vue";
import { useTerminalHistory } from "~/composables/useTerminalHistory";
```

Add inside the script, after the `inputEl` ref:

```ts
const historyRef = toRef(() => props.history ?? []);
const nav = useTerminalHistory(historyRef);
```

Replace `onKey` with:

```ts
function onKey(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    nav.reset();
    emit("submit", props.modelValue);
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    nav.up();
    emit("update:modelValue", nav.currentEntry.value ?? "");
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    nav.down();
    emit("update:modelValue", nav.currentEntry.value ?? "");
    return;
  }
}
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- ResumePrompt`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add app/components/resume/ResumePrompt.vue tests/component/ResumePrompt.test.ts
git commit -m "Add ArrowUp/ArrowDown history navigation to ResumePrompt"
```

---

## Task 25: ResumePrompt — Tab completion

**Files:**
- Modify: `app/components/resume/ResumePrompt.vue`
- Modify: `tests/component/ResumePrompt.test.ts`

Single completion → fill input. Multiple → emit `candidates`.

- [ ] **Step 1: Append failing tests**

Append to `tests/component/ResumePrompt.test.ts`:

```ts
describe("ResumePrompt — Tab completion", () => {
  it("Tab with a single matching command completes the input", async () => {
    let current = "who";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "who",
        history: [],
        commands: ["whoami", "help"],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Tab" });
    expect(current).toBe("whoami");
  });

  it("Tab with multiple matches emits candidates and leaves input alone", async () => {
    let current = "c";
    const candidates: string[][] = [];
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "c",
        history: [],
        commands: ["cat summary.md", "contact", "clear"],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
        "onCandidates": (v: string[]) => { candidates.push(v); },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Tab" });
    expect(current).toBe("c");
    expect(candidates.length).toBe(1);
    expect(candidates[0]).toEqual(expect.arrayContaining(["cat summary.md", "contact", "clear"]));
  });
});
```

- [ ] **Step 2: Run to verify FAIL**

Run: `pnpm test:unit -- ResumePrompt`

- [ ] **Step 3: Add Tab handling**

In `app/components/resume/ResumePrompt.vue`:

Add import:

```ts
import { getCompletions } from "~/utils/tabComplete";
```

Add to `onKey`, above the final closing brace (after the ArrowDown block):

```ts
  if (e.key === "Tab") {
    e.preventDefault();
    const { completion, candidates } = getCompletions(props.modelValue, {
      commands: props.commands ?? [],
      projects: props.projectSlugs ?? [],
      posts: props.postSlugs ?? [],
    });
    if (completion !== null) {
      emit("update:modelValue", completion);
    } else if (candidates.length > 0) {
      emit("candidates", candidates);
    }
    return;
  }
```

- [ ] **Step 4: Run to verify PASS**

Run: `pnpm test:unit -- ResumePrompt`

- [ ] **Step 5: Smoke-test**

Run: `pnpm dev` → /resume → type `who` + Tab → input becomes `whoami`. Type `c` + Tab → candidate list appears above the prompt. Type `cat projects/` + Tab → lists all project slugs. Kill server.

- [ ] **Step 6: Commit**

```bash
git add app/components/resume/ResumePrompt.vue tests/component/ResumePrompt.test.ts
git commit -m "Add Tab completion to ResumePrompt"
```

---

## Task 26: E2E tests for new commands

**Files:**
- Modify: `tests/e2e/resume.spec.ts`

- [ ] **Step 1: Append 4 new tests at the bottom of the `describe` block**

Inside the `test.describe("résumé terminal", () => { ... })` block in `tests/e2e/resume.spec.ts`, append:

```ts
  test("ls projects/ lists all project slugs", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("ls projects/");
    await input.press("Enter");
    // Expect at least one known project slug as a clickable entry
    await expect(terminal(page).getByText(/01-jump\.md/)).toBeVisible();
  });

  test("grep Vue returns at least one highlighted match", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("grep Vue");
    await input.press("Enter");
    await expect(terminal(page).locator("mark").first()).toBeVisible();
  });

  test("theme light flips <html> data-theme and persists through a reload", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("theme light");
    await input.press("Enter");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    // Reset so later tests don't inherit light mode
    const input2 = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input2.fill("theme dark");
    await input2.press("Enter");
  });

  test("ArrowUp recalls the most recent command", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("contact");
    await input.press("Enter");
    await expect(terminal(page).getByText("hello@digitalseraph.com").first()).toBeVisible();
    await input.press("ArrowUp");
    await expect(input).toHaveValue("contact");
  });
```

Also update the existing "unknown command" test to match the new bash-style error:

```ts
  test("unknown command shows bash-style 'command not found'", async ({ page }) => {
    await page.goto("/resume");
    await expect(terminal(page).getByText("David Miller", { exact: false })).toBeVisible();
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("foobar");
    await input.press("Enter");
    await expect(terminal(page).getByText(/bash: foobar: command not found/)).toBeVisible();
  });
```

(Replace the existing test named "unknown command shows 'command not found'" with the above.)

- [ ] **Step 2: Run the E2E suite**

Run: `pnpm test:e2e`
Expected: all pass (including the 4 new tests + the updated unknown-command test).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/resume.spec.ts
git commit -m "Add E2E tests for new terminal commands"
```

---

## Task 27: Final verification

**Files:** none (read-only)

Ensure everything still compiles and tests pass end-to-end.

- [ ] **Step 1: Typecheck**

Run: `pnpm build`
Expected: clean build with `.output/public` produced. No type errors.

- [ ] **Step 2: Run full unit test suite**

Run: `pnpm test:unit`
Expected: all pass.

- [ ] **Step 3: Run full E2E suite**

Run: `pnpm test:e2e`
Expected: all pass.

- [ ] **Step 4: Manual smoke walkthrough**

Run: `pnpm dev`. On `/resume`:

1. Prompt reads `userNNNNN@digitalseraph:~$` with a random 5-digit number.
2. `help` → three-section HelpBlock.
3. `ls` → DirectoryListing with 7 entries.
4. `ls projects/` → list of all 5 project slugs as links.
5. `cat projects/01-jump.md` → ProjectPreview card.
6. `cat projects/bogus.md` → bash-style "No such file or directory".
7. `grep Vue` → GrepResults with highlighted matches.
8. `date` → today's date in en-US short form.
9. `uname -a` → full build string.
10. `echo <script>alert(1)</script>` → literal text, NO alert fires (verify DevTools console is clean).
11. `theme light` → flips to light. `theme dark` → back. `theme` → current mode.
12. `sudo rm -rf /` → "userNNNNN is not in the sudoers file..." with your actual random user.
13. Type `whoami`, press Enter, press ↑ → input restores to `whoami`. Press ↑ again → no crash.
14. Type `c` + Tab → candidates list (contact, clear, cat ..., etc.) appears above the prompt.
15. Type `exit` → navigates to `/`.
16. `pdf` → opens print dialog.

Kill server.

- [ ] **Step 5: Update CHANGELOG.md with an "Unreleased" entry**

Open `CHANGELOG.md`, add under an `## [Unreleased]` / `### Added` section (create if missing):

```
- Terminal enhancements on `/resume`: command history (↑/↓), Tab completion, bash-style errors, new `user<random>@digitalseraph:~$` prompt, and new commands — `ls`, `cat projects/<slug>.md`, `cat writing/<slug>.md`, `grep <term>`, `date`, `uname [-a]`, `echo`, `sudo`, `exit`/`logout`, `theme [light|dark]`.
```

- [ ] **Step 6: Commit the changelog**

```bash
git add CHANGELOG.md
git commit -m "Document terminal enhancements in CHANGELOG"
```

- [ ] **Step 7: (Optional) Push the branch and open a PR**

```bash
git push -u origin feat/terminal-enhancements
gh pr create --title "Terminal enhancements: history, tab-complete, new commands" --body "See docs/superpowers/specs/2026-04-19-terminal-enhancements-design.md and docs/superpowers/plans/2026-04-19-terminal-enhancements.md."
```

---

## Notes for the implementer

- **Commit style:** plain short subject lines, no conventional-commits prefix (see `git log --oneline -20`).
- **Testing philosophy here:** every command gets at least one unit test; the prompt's keyboard surface gets component tests; user-visible behavior gets one E2E test apiece. Don't be tempted to "just run the dev server" instead of writing tests.
- **Don't over-engineer the flavor commands.** `date` / `uname` / `sudo` / `echo` are each 3 lines. Resist helper extraction.
- **The dispatcher is pure**, so unit-testing individual commands needs no mocks beyond a hand-rolled `DispatchContext` fixture. No Nuxt runtime required.
- **SSR safety:** `useRandomUsername` must early-return `""` on the server. `ResumeTerminal` handles empty-string username gracefully by falling back to `"user"`.
