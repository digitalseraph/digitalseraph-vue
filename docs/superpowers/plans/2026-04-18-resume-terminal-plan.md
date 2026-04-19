# Interactive Résumé Terminal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stub at `/resume` with a scripted interactive terminal that auto-types a `whoami` intro, accepts typed and sidebar-driven commands, streams content from `content/resume.yml`, and supports PDF export via a print-only view.

**Architecture:** Composable-driven Vue 3 components in `app/components/resume/`, stateful orchestrator (`ResumeTerminal`) holds a buffer of entries and dispatches commands through a pure function. Output is a union-typed entry (`text | component | clear | null`) that each entry renderer interprets. Print-only layout lives alongside the terminal and appears only in `@media print`. Data loads once via `useResume()` backed by @nuxt/content's `data` collection for `resume.yml`.

**Tech Stack:** Nuxt 4, Vue 3, TypeScript strict, @nuxt/content (data collection), existing Pinia stores (`theme`, `motion`), existing composables (`useTyping`, `useReveal`), Tailwind v4 with existing design tokens.

**Spec reference:** `docs/superpowers/specs/2026-04-18-resume-terminal-design.md`

---

## File Structure (produced by this plan)

```
app/
├── components/
│   └── resume/
│       ├── ResumeTerminal.vue
│       ├── ResumeSidebar.vue
│       ├── ResumeBuffer.vue
│       ├── ResumePrompt.vue
│       ├── ResumeEntry.vue
│       ├── ResumePrintView.vue
│       └── outputs/
│           ├── WhoamiBlock.vue
│           ├── ExperienceList.vue
│           ├── SkillsGrid.vue
│           ├── EducationBlock.vue
│           ├── ContactBlock.vue
│           └── HelpBlock.vue
├── composables/
│   └── useResume.ts
├── pages/
│   └── resume.vue                      # replaces stub
├── types/
│   └── resume.ts                       # Resume, Experience, etc.
└── utils/
    └── resumeDispatcher.ts             # pure command dispatcher
content.config.ts                        # add resume data collection
tests/unit/
├── useResume.test.ts
└── resumeDispatcher.test.ts
tests/e2e/
└── resume.spec.ts                      # Playwright scenarios
```

---

## Phase 0 — Data types and loading

### Task 1: Resume type definitions

**Files:**
- Create: `app/types/resume.ts`

- [ ] **Step 1: Write the types**

```ts
// app/types/resume.ts

export interface ResumeHeader {
  name: string;
  title: string;
  subtitle?: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
}

export interface Experience {
  role: string;
  company: string;
  location: string;
  start: string;       // "YYYY-MM"
  end: string;         // "YYYY-MM" or "present"
  bullets: string[];
  tech: string[];
  freelance?: boolean;
}

export interface Education {
  school: string;
  location: string;
  degree: string;
  field?: string;
  year: number;
}

export interface Certification {
  name: string;
  code?: string;
  issued: string;      // "YYYY-MM"
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Contact {
  email: string;
  github: string;
  linkedin: string;
}

export interface Resume {
  header: ResumeHeader;
  summary: string;
  experience: Experience[];
  education: Education[];
  certifications: Certification[];
  skills: SkillGroup[];
  contact: Contact;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/types/resume.ts
git commit -m "feat(resume): add Resume type definitions"
```

---

### Task 2: Register resume as a @nuxt/content data collection

**Files:**
- Modify: `content.config.ts`

- [ ] **Step 1: Read the current content.config.ts**

Current contents (verify before editing):
```ts
import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    about: defineCollection({ type: "page", source: "about.md" }),
    work: defineCollection({ type: "page", source: "work/*.md", schema: /* ... */ }),
    writing: defineCollection({ type: "page", source: "writing/*.md", schema: /* ... */ }),
  },
});
```

- [ ] **Step 2: Add the `resume` data collection inside the `collections` object**

Add a `resume` entry after `writing`:

```ts
    resume: defineCollection({
      type: "data",
      source: "resume.yml",
      schema: z.object({
        header: z.object({
          name: z.string(),
          title: z.string(),
          subtitle: z.string().optional(),
          location: z.string(),
          email: z.string(),
          github: z.string(),
          linkedin: z.string(),
        }),
        summary: z.string(),
        experience: z.array(z.object({
          role: z.string(),
          company: z.string(),
          location: z.string(),
          start: z.string(),
          end: z.string(),
          bullets: z.array(z.string()),
          tech: z.array(z.string()),
          freelance: z.boolean().optional(),
        })),
        education: z.array(z.object({
          school: z.string(),
          location: z.string(),
          degree: z.string(),
          field: z.string().optional(),
          year: z.number(),
        })),
        certifications: z.array(z.object({
          name: z.string(),
          code: z.string().optional(),
          issued: z.string(),
        })),
        skills: z.array(z.object({
          group: z.string(),
          items: z.array(z.string()),
        })),
        contact: z.object({
          email: z.string(),
          github: z.string(),
          linkedin: z.string(),
        }),
      }),
    }),
```

- [ ] **Step 3: Verify dev server boots and collection resolves**

Run: `pnpm dev`
Expected: No schema-validation errors. The log line `[@nuxt/content] ✔ Processed N collections` includes a count ≥ 5 (about, work, writing, resume + info).

- [ ] **Step 4: Commit**

```bash
git add content.config.ts
git commit -m "feat(resume): register resume.yml as @nuxt/content data collection"
```

---

### Task 3: `useResume()` composable with test

**Files:**
- Create: `app/composables/useResume.ts`
- Test: `tests/unit/useResume.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/useResume.test.ts
import { describe, it, expect, vi } from "vitest";
import { useResume } from "~/composables/useResume";

describe("useResume", () => {
  it("returns the parsed resume shape when queryCollection resolves", async () => {
    const mockResume = {
      header: { name: "Test", title: "Test Role", location: "Remote", email: "a@b", github: "x", linkedin: "y" },
      summary: "test summary",
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      contact: { email: "a@b", github: "x", linkedin: "y" },
    };
    vi.stubGlobal("queryCollection", (name: string) => {
      expect(name).toBe("resume");
      return { first: async () => mockResume };
    });

    const resume = await useResume();
    expect(resume.value?.header.name).toBe("Test");
    expect(resume.value?.summary).toBe("test summary");
  });

  it("returns null when queryCollection yields no data", async () => {
    vi.stubGlobal("queryCollection", () => ({ first: async () => null }));
    const resume = await useResume();
    expect(resume.value).toBeNull();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test:unit`
Expected: FAIL — `useResume` cannot be imported.

- [ ] **Step 3: Implement `useResume`**

```ts
// app/composables/useResume.ts
import type { Resume } from "~/types/resume";

export async function useResume() {
  const { data } = await useAsyncData("resume", () =>
    queryCollection("resume").first()
  );
  return data as Ref<Resume | null>;
}
```

Note: the `Ref` type and `useAsyncData` function are Nuxt auto-imports. The test stubs `queryCollection` directly, so we don't need to import it. If the test environment is missing `useAsyncData`, add an inline fallback:

```ts
// Fallback if test env doesn't autoimport useAsyncData.
// Check with: pnpm test:unit
// If test fails with "useAsyncData is not defined", use this form instead:
//
// export async function useResume() {
//   const value = await (globalThis as any).queryCollection("resume").first();
//   return ref(value) as Ref<Resume | null>;
// }
```

Start with the `useAsyncData` form; switch to the fallback if the test fails on `useAsyncData is not defined`.

- [ ] **Step 4: Run — expect PASS (use fallback if needed)**

Run: `pnpm test:unit`
Expected: Both tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/composables/useResume.ts tests/unit/useResume.test.ts
git commit -m "feat(resume): useResume composable"
```

---

## Phase 1 — Command dispatcher (pure function)

### Task 4: Command dispatcher

**Files:**
- Create: `app/utils/resumeDispatcher.ts`
- Test: `tests/unit/resumeDispatcher.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// tests/unit/resumeDispatcher.test.ts
import { describe, it, expect, vi } from "vitest";
import { dispatchCommand, normalizeCommand } from "~/utils/resumeDispatcher";
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

describe("normalizeCommand", () => {
  it("lowercases and trims", () => {
    expect(normalizeCommand("  Cat Summary.md  ")).toBe("cat summary.md");
  });
  it("collapses internal whitespace", () => {
    expect(normalizeCommand("ls   skills/")).toBe("ls skills/");
  });
});

describe("dispatchCommand", () => {
  it("dispatches whoami to a component entry", () => {
    expect(dispatchCommand("whoami", resume)).toEqual({ kind: "component", name: "WhoamiBlock" });
  });
  it("dispatches cat summary.md to a text entry with the resume summary", () => {
    expect(dispatchCommand("cat summary.md", resume)).toEqual({ kind: "text", text: "fake summary" });
  });
  it("dispatches cat experience.md to ExperienceList", () => {
    expect(dispatchCommand("cat experience.md", resume)).toEqual({ kind: "component", name: "ExperienceList" });
  });
  it("dispatches ls skills/ to SkillsGrid", () => {
    expect(dispatchCommand("ls skills/", resume)).toEqual({ kind: "component", name: "SkillsGrid" });
  });
  it("dispatches cat education.md to EducationBlock", () => {
    expect(dispatchCommand("cat education.md", resume)).toEqual({ kind: "component", name: "EducationBlock" });
  });
  it("dispatches contact to ContactBlock", () => {
    expect(dispatchCommand("contact", resume)).toEqual({ kind: "component", name: "ContactBlock" });
  });
  it("dispatches help and ? to HelpBlock", () => {
    expect(dispatchCommand("help", resume)).toEqual({ kind: "component", name: "HelpBlock" });
    expect(dispatchCommand("?", resume)).toEqual({ kind: "component", name: "HelpBlock" });
  });
  it("dispatches clear to a clear entry", () => {
    expect(dispatchCommand("clear", resume)).toEqual({ kind: "clear" });
  });
  it("dispatches pdf to null and calls window.print", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("window", { print: printSpy });
    expect(dispatchCommand("pdf", resume)).toBeNull();
    expect(printSpy).toHaveBeenCalledOnce();
  });
  it("returns a text entry for unknown commands", () => {
    expect(dispatchCommand("foobar", resume)).toEqual({
      kind: "text",
      text: "command not found: foobar. try 'help'.",
    });
  });
  it("normalizes before dispatching", () => {
    expect(dispatchCommand("  CAT Summary.md ", resume)).toEqual({ kind: "text", text: "fake summary" });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `pnpm test:unit`
Expected: FAIL — imports unresolved.

- [ ] **Step 3: Implement the dispatcher**

```ts
// app/utils/resumeDispatcher.ts
import type { Resume } from "~/types/resume";

export type OutputEntry =
  | { kind: "text"; text: string }
  | { kind: "component"; name: string }
  | { kind: "clear" }
  | null;

export function normalizeCommand(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dispatchCommand(input: string, resume: Resume): OutputEntry {
  const cmd = normalizeCommand(input);

  switch (cmd) {
    case "whoami":
      return { kind: "component", name: "WhoamiBlock" };
    case "cat summary.md":
      return { kind: "text", text: resume.summary };
    case "cat experience.md":
      return { kind: "component", name: "ExperienceList" };
    case "ls skills/":
      return { kind: "component", name: "SkillsGrid" };
    case "cat education.md":
      return { kind: "component", name: "EducationBlock" };
    case "contact":
      return { kind: "component", name: "ContactBlock" };
    case "help":
    case "?":
      return { kind: "component", name: "HelpBlock" };
    case "clear":
      return { kind: "clear" };
    case "pdf":
      if (typeof window !== "undefined") window.print();
      return null;
    default:
      return { kind: "text", text: `command not found: ${cmd}. try 'help'.` };
  }
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `pnpm test:unit`
Expected: All new tests pass. Theme, motion, composable tests from Plan 1 still pass.

- [ ] **Step 5: Commit**

```bash
git add app/utils/resumeDispatcher.ts tests/unit/resumeDispatcher.test.ts
git commit -m "feat(resume): pure command dispatcher + normalizer"
```

---

## Phase 2 — Core terminal primitives

### Task 5: `ResumePrompt.vue` (input line with cursor)

**Files:**
- Create: `app/components/resume/ResumePrompt.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "submit", v: string): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);

function focus() {
  inputEl.value?.focus();
}

function onEnter(e: KeyboardEvent) {
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
    <span class="text-[var(--accent)] select-none">$</span>
    <input
      ref="inputEl"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onEnter"
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

- [ ] **Step 2: Verify dev server compiles**

Run: `pnpm dev`. Visit any page (nothing rendered yet — this is a leaf component). Expected: no compile errors. Kill server.

- [ ] **Step 3: Commit**

```bash
git add app/components/resume/ResumePrompt.vue
git commit -m "feat(resume): ResumePrompt input line with blinking cursor"
```

---

### Task 6: `ResumeBuffer.vue` (scrollable container)

**Files:**
- Create: `app/components/resume/ResumeBuffer.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";

const props = defineProps<{ entryCount: number }>();

const scrollEl = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const showJumpPill = ref(false);
const JUMP_THRESHOLD = 100;

function onScroll() {
  const el = scrollEl.value;
  if (!el) return;
  const distFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
  if (distFromBottom > JUMP_THRESHOLD) {
    autoScroll.value = false;
    showJumpPill.value = true;
  } else {
    autoScroll.value = true;
    showJumpPill.value = false;
  }
}

function jumpToBottom() {
  const el = scrollEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

watch(() => props.entryCount, async () => {
  await nextTick();
  if (autoScroll.value) jumpToBottom();
});

onMounted(jumpToBottom);

function focusInput() {
  // delegate to parent via event; parent owns the prompt
  emit("focus-input");
}

const emit = defineEmits<{ (e: "focus-input"): void }>();
</script>

<template>
  <div class="relative flex-1 overflow-hidden">
    <div
      ref="scrollEl"
      @scroll="onScroll"
      @click="focusInput"
      tabindex="-1"
      role="log"
      aria-live="polite"
      aria-label="Résumé terminal output"
      class="h-full overflow-y-auto pr-2 font-mono text-[var(--text-mono)] leading-relaxed focus:outline-none"
    >
      <slot />
    </div>
    <button
      v-if="showJumpPill"
      type="button"
      @click="jumpToBottom"
      class="absolute bottom-2 right-2 font-mono text-xs px-3 py-1 rounded-full bg-[var(--canvas-raised)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--canvas)] transition-colors"
    >↓ jump to latest</button>
  </div>
</template>
```

- [ ] **Step 2: Verify compiles**

Run: `pnpm dev`. Expected: no errors. Kill server.

- [ ] **Step 3: Commit**

```bash
git add app/components/resume/ResumeBuffer.vue
git commit -m "feat(resume): ResumeBuffer scrollable log with auto-scroll and jump pill"
```

---

### Task 7: `ResumeEntry.vue` (single buffer row)

**Files:**
- Create: `app/components/resume/ResumeEntry.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { computed } from "vue";
import WhoamiBlock from "./outputs/WhoamiBlock.vue";
import ExperienceList from "./outputs/ExperienceList.vue";
import SkillsGrid from "./outputs/SkillsGrid.vue";
import EducationBlock from "./outputs/EducationBlock.vue";
import ContactBlock from "./outputs/ContactBlock.vue";
import HelpBlock from "./outputs/HelpBlock.vue";
import type { OutputEntry } from "~/utils/resumeDispatcher";

const props = defineProps<{
  input: string;
  output: OutputEntry;
}>();

const outputMap: Record<string, ReturnType<typeof defineComponent> | any> = {
  WhoamiBlock,
  ExperienceList,
  SkillsGrid,
  EducationBlock,
  ContactBlock,
  HelpBlock,
};

const component = computed(() =>
  props.output?.kind === "component" ? outputMap[props.output.name] ?? null : null
);
</script>

<template>
  <div class="mb-4">
    <div class="flex items-baseline gap-2 mb-2">
      <span class="text-[var(--accent)] select-none">$</span>
      <span class="text-[var(--text)]">{{ input }}</span>
    </div>
    <div class="pl-[22px] text-[var(--text-muted)]">
      <template v-if="output?.kind === 'text'">
        <span class="whitespace-pre-wrap">{{ output.text }}</span>
      </template>
      <component v-else-if="component" :is="component" />
    </div>
  </div>
</template>
```

Note: `defineComponent` is implicitly available via Nuxt's auto-imports; if TypeScript complains, add `import { defineComponent } from "vue"`.

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/ResumeEntry.vue
git commit -m "feat(resume): ResumeEntry wrapper rendering input echo + output"
```

---

## Phase 3 — Output components

### Task 8: `WhoamiBlock.vue`

**Files:**
- Create: `app/components/resume/outputs/WhoamiBlock.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const resume = await useResume();
const header = computed(() => resume.value?.header);
</script>

<template>
  <div v-if="header" class="space-y-1">
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">name:</span> {{ header.name }}</div>
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">title:</span> {{ header.title }}<span v-if="header.subtitle"> · {{ header.subtitle }}</span></div>
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">location:</span> {{ header.location }}</div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/WhoamiBlock.vue
git commit -m "feat(resume): WhoamiBlock output"
```

---

### Task 9: `ExperienceList.vue`

**Files:**
- Create: `app/components/resume/outputs/ExperienceList.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const resume = await useResume();
const experience = computed(() => resume.value?.experience ?? []);

function fmtDate(d: string): string {
  if (d === "present") return "present";
  // "YYYY-MM" → "Mon YYYY"
  const [y, m] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  return `${months[mi] ?? m} ${y}`;
}
</script>

<template>
  <div class="space-y-5">
    <div v-for="(role, i) in experience" :key="i" class="border-l-2 border-[var(--line)] pl-4 reveal-line" :style="{ '--delay': `${i * 20}ms` }">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span class="text-[var(--text)] font-semibold">{{ role.role }}</span>
          <span class="text-[var(--text-muted)]"> @ {{ role.company }}</span>
          <span v-if="role.freelance" class="text-[var(--text-dim)] text-xs"> (freelance)</span>
        </div>
        <div class="text-[var(--text-dim)] text-xs">
          {{ fmtDate(role.start) }} — {{ fmtDate(role.end) }} · {{ role.location }}
        </div>
      </div>
      <ul class="mt-2 space-y-1">
        <li v-for="(bullet, j) in role.bullets" :key="j" class="text-[var(--text-muted)]">
          <span class="text-[var(--text-dim)]">›</span> {{ bullet }}
        </li>
      </ul>
      <div class="mt-2 text-[var(--text-dim)] text-xs italic">
        tech: {{ role.tech.join(", ") }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.reveal-line {
  opacity: 0;
  transform: translateY(4px);
  animation: reveal 400ms cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
  animation-delay: var(--delay);
}
@keyframes reveal {
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .reveal-line { animation: none; opacity: 1; transform: none; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/ExperienceList.vue
git commit -m "feat(resume): ExperienceList output with staggered reveal"
```

---

### Task 10: `SkillsGrid.vue`

**Files:**
- Create: `app/components/resume/outputs/SkillsGrid.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const resume = await useResume();
const skills = computed(() => resume.value?.skills ?? []);
</script>

<template>
  <div class="space-y-3">
    <div v-for="(group, gi) in skills" :key="group.group" class="reveal-line" :style="{ '--delay': `${gi * 25}ms` }">
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1.5">{{ group.group }}</div>
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="item in group.items"
          :key="item"
          class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs"
        >{{ item }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reveal-line {
  opacity: 0;
  transform: translateY(4px);
  animation: reveal 400ms cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
  animation-delay: var(--delay);
}
@keyframes reveal { to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: reduce) {
  .reveal-line { animation: none; opacity: 1; transform: none; }
}
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/SkillsGrid.vue
git commit -m "feat(resume): SkillsGrid output"
```

---

### Task 11: `EducationBlock.vue`

**Files:**
- Create: `app/components/resume/outputs/EducationBlock.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const resume = await useResume();
const education = computed(() => resume.value?.education ?? []);
const certs = computed(() => resume.value?.certifications ?? []);

function fmtYearMonth(d: string): string {
  const [y, m] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  return `${months[mi] ?? m} ${y}`;
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1.5">education</div>
      <div v-for="(ed, i) in education" :key="i" class="text-[var(--text-muted)]">
        <div class="text-[var(--text)] font-semibold">{{ ed.degree }}<span v-if="ed.field"> — {{ ed.field }}</span></div>
        <div>{{ ed.school }} · {{ ed.location }} · {{ ed.year }}</div>
      </div>
    </div>
    <div v-if="certs.length">
      <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-1.5">certifications</div>
      <div v-for="(cert, i) in certs" :key="i" class="text-[var(--text-muted)]">
        <span class="text-[var(--text)]">{{ cert.name }}</span>
        <span v-if="cert.code"> — {{ cert.code }}</span>
        <span class="text-[var(--text-dim)]"> · issued {{ fmtYearMonth(cert.issued) }}</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/EducationBlock.vue
git commit -m "feat(resume): EducationBlock output"
```

---

### Task 12: `ContactBlock.vue`

**Files:**
- Create: `app/components/resume/outputs/ContactBlock.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import CopyInline from "~/components/primitives/CopyInline.vue";
const resume = await useResume();
const contact = computed(() => resume.value?.contact);
</script>

<template>
  <div v-if="contact" class="space-y-1">
    <div><span class="text-[var(--text-dim)]">email:</span> <CopyInline :value="contact.email" /></div>
    <div>
      <span class="text-[var(--text-dim)]">github:</span>
      <a :href="`https://github.com/${contact.github}`" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline">github.com/{{ contact.github }}</a>
    </div>
    <div>
      <span class="text-[var(--text-dim)]">linkedin:</span>
      <a :href="`https://linkedin.com/in/${contact.linkedin}`" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline">linkedin.com/in/{{ contact.linkedin }}</a>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/ContactBlock.vue
git commit -m "feat(resume): ContactBlock output"
```

---

### Task 13: `HelpBlock.vue`

**Files:**
- Create: `app/components/resume/outputs/HelpBlock.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
interface HelpRow { cmd: string; hint: string; }

const rows: HelpRow[] = [
  { cmd: "whoami", hint: "name, title, location" },
  { cmd: "cat summary.md", hint: "one-paragraph professional summary" },
  { cmd: "cat experience.md", hint: "full work history" },
  { cmd: "ls skills/", hint: "skills grouped by category" },
  { cmd: "cat education.md", hint: "education + certifications" },
  { cmd: "contact", hint: "email + github + linkedin" },
  { cmd: "help, ?", hint: "this list" },
  { cmd: "clear", hint: "wipe the buffer" },
  { cmd: "pdf", hint: "open Save-as-PDF dialog" },
];
</script>

<template>
  <div class="space-y-0.5">
    <div v-for="row in rows" :key="row.cmd" class="flex gap-3">
      <code class="text-[var(--accent)] min-w-[160px]">{{ row.cmd }}</code>
      <span class="text-[var(--text-muted)]">{{ row.hint }}</span>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/outputs/HelpBlock.vue
git commit -m "feat(resume): HelpBlock output"
```

---

## Phase 4 — Orchestrator

### Task 14: `ResumeTerminal.vue`

**Files:**
- Create: `app/components/resume/ResumeTerminal.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useMotionStore } from "~/stores/motion";
import { dispatchCommand, type OutputEntry } from "~/utils/resumeDispatcher";
import ResumeBuffer from "./ResumeBuffer.vue";
import ResumeEntry from "./ResumeEntry.vue";
import ResumePrompt from "./ResumePrompt.vue";
import ResumeSidebar from "./ResumeSidebar.vue";

const resume = await useResume();
const motion = useMotionStore();
const { reduced } = storeToRefs(motion);

interface BufferEntry {
  id: string;
  input: string;
  output: OutputEntry;
}

const buffer = ref<BufferEntry[]>([]);
const input = ref("");
const isStreaming = ref(false);
const promptRef = ref<InstanceType<typeof ResumePrompt> | null>(null);

let entryCounter = 0;
function nextId() {
  entryCounter += 1;
  return `entry-${entryCounter}`;
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

async function runCommand(cmd: string) {
  if (!resume.value) return;
  if (isStreaming.value) {
    // interrupt — current output is already a committed buffer entry, just proceed
    isStreaming.value = false;
  }

  const raw = cmd.trim();
  if (!raw) return;

  const output = dispatchCommand(raw, resume.value);

  if (output?.kind === "clear") {
    buffer.value = [];
  } else if (output !== null) {
    buffer.value = [...buffer.value, { id: nextId(), input: raw, output }];
  }

  input.value = "";
  await nextTick();
  promptRef.value?.focus();
}

function onSidebarRun(cmd: string) {
  typeInto(cmd).then(() => runCommand(cmd));
}

async function runIntro() {
  const introCmd = "whoami";
  await typeInto(introCmd);
  // Slight breath between typing and dispatch
  await new Promise((r) => setTimeout(r, reduced.value ? 0 : 150));
  await runCommand(introCmd);
}

onMounted(() => {
  runIntro();
});
</script>

<template>
  <div class="grid grid-cols-[240px_1fr] max-lg:grid-cols-1 gap-4 h-[calc(100vh-48px)] max-w-[1280px] mx-auto px-4 md:px-8">
    <ResumeSidebar class="max-lg:order-first" @run="onSidebarRun" />
    <div class="flex flex-col min-h-0 pt-6 pb-2">
      <ResumeBuffer :entry-count="buffer.length" @focus-input="() => promptRef?.focus()">
        <ResumeEntry v-for="entry in buffer" :key="entry.id" :input="entry.input" :output="entry.output" />
      </ResumeBuffer>
      <ResumePrompt ref="promptRef" v-model="input" @submit="runCommand" />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/ResumeTerminal.vue
git commit -m "feat(resume): ResumeTerminal orchestrator"
```

---

### Task 15: `ResumeSidebar.vue`

**Files:**
- Create: `app/components/resume/ResumeSidebar.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
interface CmdItem { cmd: string; hint: string; group: "sections" | "utilities" }

const items: CmdItem[] = [
  { cmd: "whoami", hint: "identity", group: "sections" },
  { cmd: "cat summary.md", hint: "summary", group: "sections" },
  { cmd: "cat experience.md", hint: "experience", group: "sections" },
  { cmd: "ls skills/", hint: "skills", group: "sections" },
  { cmd: "cat education.md", hint: "education", group: "sections" },
  { cmd: "contact", hint: "contact", group: "sections" },
  { cmd: "help", hint: "help", group: "utilities" },
  { cmd: "clear", hint: "clear", group: "utilities" },
  { cmd: "pdf", hint: "save PDF", group: "utilities" },
];

const emit = defineEmits<{ (e: "run", cmd: string): void }>();
const sections = items.filter(i => i.group === "sections");
const utilities = items.filter(i => i.group === "utilities");
</script>

<template>
  <nav aria-label="Résumé sections" class="font-mono text-[var(--text-mono)] pt-6 lg:border-r lg:border-[var(--line)] lg:pr-4 max-lg:overflow-x-auto">
    <div class="max-lg:flex max-lg:gap-2 max-lg:whitespace-nowrap lg:space-y-4">
      <div class="max-lg:flex max-lg:gap-2 lg:block">
        <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-2 max-lg:hidden">— sections —</div>
        <button
          v-for="item in sections"
          :key="item.cmd"
          type="button"
          @click="emit('run', item.cmd)"
          class="block w-full max-lg:w-auto text-left px-2 py-1 rounded max-lg:border max-lg:border-[var(--line)] hover:bg-[var(--canvas-raised)] hover:text-[var(--accent)] transition-colors"
        >
          <span class="text-[var(--accent)]">$</span>
          <span class="ml-1 text-[var(--text)]">{{ item.cmd }}</span>
        </button>
      </div>
      <div class="max-lg:flex max-lg:gap-2 lg:block">
        <div class="text-[var(--text-dim)] text-xs uppercase tracking-[0.15em] mb-2 max-lg:hidden">— utilities —</div>
        <button
          v-for="item in utilities"
          :key="item.cmd"
          type="button"
          @click="emit('run', item.cmd)"
          class="block w-full max-lg:w-auto text-left px-2 py-1 rounded max-lg:border max-lg:border-[var(--line)] hover:bg-[var(--canvas-raised)] hover:text-[var(--accent)] transition-colors"
        >
          <span class="text-[var(--accent)]">$</span>
          <span class="ml-1 text-[var(--text)]">{{ item.cmd }}</span>
        </button>
      </div>
    </div>
  </nav>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/ResumeSidebar.vue
git commit -m "feat(resume): ResumeSidebar with responsive chip fallback"
```

---

## Phase 5 — Print view + wire page

### Task 16: `ResumePrintView.vue`

**Files:**
- Create: `app/components/resume/ResumePrintView.vue`

- [ ] **Step 1: Implement**

```vue
<script setup lang="ts">
const resume = await useResume();
const r = computed(() => resume.value);

function fmtDate(d: string): string {
  if (d === "present") return "Present";
  const [y, m] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = parseInt(m, 10) - 1;
  return `${months[mi] ?? m} ${y}`;
}

function today(): string {
  return new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
</script>

<template>
  <div v-if="r" class="print-view" aria-hidden="true">
    <header class="doc-header">
      <h1>{{ r.header.name }}</h1>
      <p class="title">{{ r.header.title }} · {{ r.header.subtitle }}</p>
      <p class="contact">
        {{ r.header.location }} · {{ r.header.email }} ·
        github.com/{{ r.header.github }} · linkedin.com/in/{{ r.header.linkedin }}
      </p>
    </header>

    <section class="summary">
      <h2>Professional Summary</h2>
      <p>{{ r.summary }}</p>
    </section>

    <section class="skills">
      <h2>Technical Skills</h2>
      <div v-for="group in r.skills" :key="group.group" class="skill-line">
        <strong>{{ group.group }}:</strong> {{ group.items.join(", ") }}
      </div>
    </section>

    <section class="experience">
      <h2>Work Experience</h2>
      <div v-for="(role, i) in r.experience" :key="i" class="role">
        <div class="role-header">
          <strong>{{ role.role }}</strong>
          <span class="dates">{{ fmtDate(role.start) }} – {{ fmtDate(role.end) }}</span>
        </div>
        <div class="role-meta"><em>{{ role.company }} — {{ role.location }}</em></div>
        <ul>
          <li v-for="(b, bi) in role.bullets" :key="bi">{{ b }}</li>
        </ul>
        <div class="tech"><em>Tech: {{ role.tech.join(", ") }}</em></div>
      </div>
    </section>

    <section class="education">
      <h2>Education</h2>
      <div v-for="(ed, i) in r.education" :key="i">
        <strong>{{ ed.degree }}<span v-if="ed.field"> — {{ ed.field }}</span></strong>
        <div>{{ ed.school }}, {{ ed.location }} · {{ ed.year }}</div>
      </div>
    </section>

    <section v-if="r.certifications.length" class="certifications">
      <h2>Certifications</h2>
      <div v-for="(c, i) in r.certifications" :key="i">
        {{ c.name }}<span v-if="c.code"> — {{ c.code }}</span> · Issued {{ fmtDate(c.issued) }}
      </div>
    </section>

    <footer class="doc-footer">digitalseraph.com · generated {{ today() }}</footer>
  </div>
</template>

<style scoped>
.print-view { display: none; }

@media print {
  .print-view {
    display: block;
    color: #111;
    background: #fff;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 9.5pt;
    line-height: 1.35;
  }
  .print-view h1 {
    font-size: 22pt;
    font-weight: 700;
    margin: 0 0 2pt;
    letter-spacing: -0.01em;
  }
  .print-view h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid #111;
    margin: 10pt 0 4pt;
    padding-bottom: 1pt;
  }
  .doc-header { margin-bottom: 8pt; }
  .doc-header .title { margin: 0 0 2pt; font-style: italic; font-size: 10pt; }
  .doc-header .contact { margin: 0; font-size: 8.5pt; }
  .skill-line { margin-bottom: 2pt; }
  .role { margin-bottom: 6pt; break-inside: avoid; }
  .role-header { display: flex; justify-content: space-between; align-items: baseline; }
  .role-header .dates { font-style: italic; font-size: 9pt; }
  .role-meta { margin-bottom: 2pt; font-size: 9pt; }
  .role ul { margin: 2pt 0; padding-left: 14pt; }
  .role li { margin-bottom: 1pt; }
  .tech { margin-top: 2pt; font-size: 8.5pt; color: #333; }
  .doc-footer { margin-top: 16pt; font-size: 8pt; color: #666; text-align: center; }
}

@page { size: letter; margin: 0.6in; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add app/components/resume/ResumePrintView.vue
git commit -m "feat(resume): ResumePrintView with print-only stylesheet"
```

---

### Task 17: Wire `/resume` page

**Files:**
- Modify: `app/pages/resume.vue`

- [ ] **Step 1: Replace file contents**

```vue
<script setup lang="ts">
import ResumeTerminal from "~/components/resume/ResumeTerminal.vue";
import ResumePrintView from "~/components/resume/ResumePrintView.vue";

useHead({ title: "Résumé — digitalseraph" });
definePageMeta({ layout: false });
</script>

<template>
  <div class="print-wrapper">
    <ResumeTerminal class="screen-only" />
    <ResumePrintView />
  </div>
</template>

<style scoped>
.screen-only { display: block; }
@media print {
  .screen-only { display: none; }
}
</style>
```

Note: `definePageMeta({ layout: false })` is important — the default `AppLayout` wraps content in `<main class="pt-12">` and adds nav/footer, which we want on the terminal's *screen* view but the Print view should escape it. Actually we need a better approach — we need to keep AppLayout but hide everything except the print view in print media.

Instead of disabling the layout, rely on `@media print` to hide nav/footer/terminal. Easier: leave `definePageMeta` default (`layout: true`), and add a `@media print` rule at the global `main.css` level.

Correct version:

```vue
<script setup lang="ts">
import ResumeTerminal from "~/components/resume/ResumeTerminal.vue";
import ResumePrintView from "~/components/resume/ResumePrintView.vue";

useHead({ title: "Résumé — digitalseraph" });
</script>

<template>
  <div>
    <ResumeTerminal class="screen-only" />
    <ResumePrintView />
  </div>
</template>

<style scoped>
.screen-only { display: block; }
@media print {
  .screen-only { display: none; }
}
</style>
```

- [ ] **Step 2: Add a global `@media print` rule in `app/assets/css/main.css`**

Append to the end of `app/assets/css/main.css`:

```css
@media print {
  nav, footer, .skip-link { display: none !important; }
  main { padding: 0 !important; }
  body { background: #fff !important; color: #111 !important; }
}
```

- [ ] **Step 3: Verify in dev**

Run: `pnpm dev`. Visit `/resume`. Expected:
- The terminal renders with sidebar + buffer + prompt
- `whoami` auto-types and runs
- Clicking sidebar entries runs commands
- Typing `help` + Enter shows the help table
- `Ctrl+P` opens the print preview showing ONLY the print view (no terminal, no nav, no footer)

- [ ] **Step 4: Commit**

```bash
git add app/pages/resume.vue app/assets/css/main.css
git commit -m "feat(resume): wire /resume page and global print reset"
```

---

## Phase 6 — E2E tests + verification

### Task 18: Playwright E2E

**Files:**
- Modify: `tests/e2e/smoke.spec.ts` (extend existing) OR
- Create: `tests/e2e/resume.spec.ts` (separate file)

Prefer separate file so the existing smoke tests stay focused.

- [ ] **Step 1: Create `tests/e2e/resume.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test.describe("résumé terminal", () => {
  test("auto-types whoami intro on load", async ({ page }) => {
    await page.goto("/resume");
    // Give the intro time to complete (~12 chars × 45ms ≈ 540ms + breath ≈ 700ms total)
    await page.waitForTimeout(1200);
    await expect(page.getByText("David Miller", { exact: false })).toBeVisible();
  });

  test("sidebar click runs cat experience.md and renders all roles", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    await page.getByRole("button", { name: /cat experience\.md/ }).click();
    await expect(page.getByText(/Cox Communications/)).toBeVisible();
    await expect(page.getByText(/Professional Photographic Resources/)).toBeVisible();
  });

  test("typing a command + Enter appends a buffer entry", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("contact");
    await input.press("Enter");
    await expect(page.getByText("hello@digitalseraph.com")).toBeVisible();
  });

  test("unknown command shows 'command not found'", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    await input.fill("foobar");
    await input.press("Enter");
    await expect(page.getByText(/command not found: foobar/)).toBeVisible();
  });

  test("clear empties the buffer", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    const input = page.getByRole("textbox", { name: /resume terminal prompt/i });
    // The intro whoami entry is in the buffer
    await expect(page.getByText(/David Miller/)).toBeVisible();
    await input.fill("clear");
    await input.press("Enter");
    await expect(page.getByText(/David Miller/)).not.toBeVisible();
  });

  test("print view is the only visible content under print media", async ({ page }) => {
    await page.goto("/resume");
    await page.waitForTimeout(1200);
    await page.emulateMedia({ media: "print" });
    // Nav should be hidden
    await expect(page.locator("nav").first()).toBeHidden();
    // Print view h1 visible
    await expect(page.locator(".print-view h1")).toContainText("David Miller");
  });

  test("reduced motion collapses typing instantly", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/resume");
    // No 1200ms wait — intro should be instant
    await page.waitForTimeout(200);
    await expect(page.getByText("David Miller", { exact: false })).toBeVisible();
  });
});
```

- [ ] **Step 2: Run E2E tests**

```bash
pnpm test:e2e tests/e2e/resume.spec.ts
```

Expected: 7/7 tests pass.

If the `print view` test fails because `.print-view h1` isn't visible even under print media, the `@media print` rule chain may be ordering-sensitive — check that the component's scoped `.print-view { display: none }` is being overridden by its `@media print` rule. Swap the ordering or elevate specificity.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/resume.spec.ts
git commit -m "test(resume): playwright E2E for terminal and print view"
```

---

### Task 19: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run all tests**

```bash
pnpm test:unit
pnpm test:e2e
```

Expected: all green. Unit tests: 12 (Plan 1) + 2 (useResume) + 12 (dispatcher) = **26**. E2E: 6 (Plan 1 smoke) + 7 (resume) = **13**.

- [ ] **Step 2: Static build**

```bash
pnpm generate
```

Expected: no errors, `.output/public/resume/index.html` exists and contains both the terminal markup and the print view markup.

- [ ] **Step 3: Manual browser verification**

Run `pnpm dev`, then in a browser:
- Visit `/resume`. Confirm `whoami` auto-types (~0.5s) and identity renders.
- Click every sidebar entry — all render without error.
- Type `help` — see the 9-row command list.
- Type `unknowncmd` — see the "command not found" line.
- Type `clear` — buffer empties.
- Hit `Ctrl+P` — the print preview shows the clean document layout, not the terminal.
- In browser devtools, toggle "Emulate CSS media feature prefers-reduced-motion: reduce" and reload — no typing animation; output is instant.
- Resize to 380px wide — sidebar collapses to horizontal chips; prompt is visible.

- [ ] **Step 4: Push for CF preview**

```bash
git push
```

Cloudflare will deploy the new version. Visit the preview URL and verify the live page. Report back if anything regresses.

---

## Self-review notes (author)

- **Spec coverage:** every numbered section of the spec maps to at least one task:
  - §2 Interaction model → Tasks 14, 15, 17
  - §3 Command set → Task 4 (dispatcher) + Task 13 (help listing)
  - §4 Layout → Tasks 14, 15
  - §5 Motion → Tasks 14 (type-into helper), 9, 10 (stagger)
  - §6 Print view → Tasks 16, 17
  - §7 Component architecture → Tasks 1, 3–17
  - §8 Testing → Tasks 3, 4, 18
- **Placeholder scan:** no "TBD", no "implement later", every code block has complete code.
- **Type consistency:** `OutputEntry`, `BufferEntry`, `Resume` all referenced identically across tasks. The `outputMap` in `ResumeEntry.vue` has one key per component created in Tasks 8–13 — verified.
- **Scope:** self-contained — doesn't bleed into Plan 3 (writing pipeline) or Plan 4 (Lighthouse). Builds only on Plan 1's primitives + Pinia stores.

## Open items to resolve during implementation

1. Whether `queryCollection("resume")` resolves a `data` collection in the same way as `page` collections — if it fails, switch to `queryCollection("resume").all()[0]` or `$fetch('/api/_content/query', {...})`.
2. Whether the intro's 1200ms wait in E2E tests is tight enough for CI (CF's runner might be slower). If flaky, bump to 2000ms.
3. The print view's 2-page target — verify after first render; if it overflows, tighten body font to 9pt or bullets to 8.5pt.
