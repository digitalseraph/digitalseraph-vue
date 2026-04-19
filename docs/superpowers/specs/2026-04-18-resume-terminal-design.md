# Interactive résumé terminal — design spec

**Date:** 2026-04-18
**Project:** `digitalseraph-vue` (standalone repo `digitalseraph/digitalseraph-vue`)
**Route:** `/resume`
**Status:** Design approved, pending implementation plan
**Supersedes:** the résumé section of `2026-04-18-digitalseraph-vue-design.md` (the original spec's "Resume (its own sub-system)" component list), adding fine-grained interaction and print-mode requirements

---

## 1. Overview

The résumé renders as a scripted terminal on `/resume`. On first load, a `$ whoami` command auto-types and runs as a one-time cinematic intro; from that point forward the page is quiet and user-driven. A sidebar of clickable commands lets users jump to sections without typing. A free-text prompt accepts the same command set as typed input. The `pdf` command invokes the browser's Save-as-PDF dialog against a print-only layout that reuses the same `resume.yml` data.

**Goals**

- Signature, on-theme feature that rewards curiosity (sidebar clicks, free typing, keyboard flow)
- Zero external dependencies for PDF export — the browser does the work
- Single source of truth: `content/resume.yml`. The terminal and the print view render from the same data
- Accessible: keyboard-first, screen-reader-safe, respects `prefers-reduced-motion`

**Non-goals (v1)**

- Fuzzy command matching or tab completion
- Command history persistence across reloads
- Remote content authoring (résumé is a committed file)
- Theming beyond the existing dark/light token set — the terminal is phosphor-green in both themes; print view is always light

---

## 2. Interaction model

### 2.1 First-load behavior (cinematic intro)

On page load:

1. Terminal renders with a tiny bootup line (e.g., `— david miller · résumé session ·` followed by a divider).
2. `$ whoami` types at ~45 ms/char.
3. Enter fires automatically; output prints the identity block (name, title, location, links).
4. Prompt returns to a focused input at the bottom. Cursor blinks.

Users arriving from intra-site navigation (via the command palette or the nav link) get the same intro — it's tied to the page mount, not a first-visit cookie. The intro is short (<2s total) so repeat viewers don't feel delayed.

### 2.2 Steady state (user-driven)

Input field auto-focuses. User can:

- **Type** a command + Enter. The typed characters echo in real time (no artificial typing; what they type appears immediately). Enter dispatches the command.
- **Click** a command in the sidebar. The sidebar entry's text is piped into the input line (brief echo, ~45 ms/char so it feels consistent with the auto-intro) then runs.
- **Press ⌘K / Ctrl+K** — still opens the global palette defined in Plan 1. Does not conflict because the palette overlays the page.

After any command runs, the input line returns empty and focused.

### 2.3 Interrupt behavior

If a new command arrives (typed Enter or sidebar click) while output is still streaming, the in-flight output completes **instantly** (no partial buffer entry), then the new command begins. No queuing.

---

## 3. Command set

| Command | Effect |
| --- | --- |
| `whoami` | Identity block — name, title, location, short tagline |
| `cat summary.md` | Professional-summary paragraph |
| `cat experience.md` | All 10 roles reverse-chronological, each with role/company header, date range, bullets, tech line |
| `ls skills/` | Skills grid — 7 groups (Languages, Frameworks & Libraries, Cloud & DevOps, Databases & Search, Tools & Platforms, Testing, Methodologies), each rendered as a row of chips |
| `cat education.md` | Education + certifications block |
| `contact` | Email + GitHub + LinkedIn, email copy-to-clipboard enabled |
| `help` or `?` | One-line description of each command |
| `clear` | Clears the buffer. Prompt stays. |
| `pdf` | Calls `window.print()`. The browser's Save-as-PDF dialog opens against the print view (section 6). |

**Unknown commands:** `command not found: <input>. try 'help'.` in the terminal's dim text color.

**Case and whitespace:** commands match case-insensitive, trimmed. `  Cat Summary.md  ` equals `cat summary.md`.

**No alias surface:** keep the command strings literal. If users ask for aliases in the future, add then — YAGNI now.

---

## 4. Layout & responsive behavior

### 4.1 Desktop (≥1024px)

Two-column grid, full viewport height minus the 48px nav:

- **Sidebar (240px fixed, left):** list of clickable commands, grouped visually with a small `-- sections --` / `-- utilities --` divider. Each row shows `$ <command>` in mono + a dim one-word hint (`experience`, `skills`). Active/last-run command has a phosphor-green left border and text color.
- **Terminal (flex, right):** scrollable output buffer on top, fixed prompt at the bottom (1px accent border separating). A subtle `GridBackdrop` (from Plan 1 primitives) sits behind the whole right column for consistency with the hero.

### 4.2 Tablet (640–1023px)

Sidebar collapses into a horizontal bar above the terminal. Chips wrap to two lines if needed. Terminal takes remaining vertical space.

### 4.3 Mobile (<640px)

Same horizontal-chip pattern, but chips scroll horizontally with `overflow-x: auto` (no wrap). Input field is pinned to the bottom via `position: fixed` on the bar alone (the buffer is the only scroll region).

### 4.4 Keyboard focus

- Input auto-focuses on page load.
- Clicking anywhere inside the buffer area refocuses the input (not the span that was clicked).
- Clicking a sidebar entry runs the command AND refocuses the input.
- Tab order: sidebar → terminal buffer (focusable container with `tabindex="-1"` so click works) → input field → footer.

### 4.5 Scroll

Buffer auto-scrolls to bottom on new output. If the user scrolls up past a 100px threshold, auto-scroll pauses; a small "↓ jump to latest" pill appears bottom-right. Scrolling back down within the threshold resumes auto-scroll and dismisses the pill.

---

## 5. Motion system

Builds on Plan 1's `useTyping` composable and the `useMotionStore` `reduced` ref.

### 5.1 Phases per command

1. **Input echo** — typed characters appear in real time when the user types; typed at ~45 ms/char when fed from a sidebar click (consistency with hero).
2. **Enter / dispatch** — input line gets appended to the buffer as a static entry showing `$ <command>`, the input clears, focus stays.
3. **Output stream** — one of:
   - **Short output** (≤3 lines, e.g. `whoami`, `contact`, unknown-command message): character-by-character typing via `useTyping`, same 45 ms/char pace.
   - **Bulk output** (`cat experience.md`, `ls skills/`, `cat education.md`, `help`): staggered fade-in, 20 ms per child line, max 500 ms total regardless of length. No typewriter effect on bullets.
4. **Prompt returns** — input re-focuses.

### 5.2 Cursor

The blinking cursor from Plan 1's `TerminalPrompt` renders inside the prompt input. It hides during output streaming and returns when output completes.

### 5.3 Reduced motion

When `motion.reduced` is true:

- All typing renders instantly (current `useTyping` already honors this)
- All staggers collapse to zero — bulk output appears as a single frame
- Input-echo for sidebar clicks is skipped — the command goes straight to the buffer

### 5.4 Performance budget

- Buffer should handle 500+ entries before any scrolling jank. Achieved by rendering entries as plain DOM (no per-entry reactive overhead beyond Vue's default).
- One `requestAnimationFrame` loop per active typing stream. No stream overlap (new input interrupts per 2.3).

---

## 6. Print view & PDF export

### 6.1 Behavior

- `pdf` command → `window.print()`.
- Print media stylesheet hides the terminal, sidebar, nav, footer, and `GridBackdrop`, and reveals the `ResumePrintView` component that was `display: none` on screen.
- Browser's Save-as-PDF dialog handles the actual export. User picks "Save as PDF" in the destination dropdown.

### 6.2 Print layout

- Single-column, letter size, 0.6" margins.
- Document header: name (large), title, location, contact line with email + GitHub + LinkedIn URLs written out.
- Professional summary paragraph.
- Technical skills — each group as a label + comma-separated list (no chips; compact text flow).
- Experience — each role as a block:
  - Header row: role (bold), company and location (italic), date range (right-aligned)
  - Bullets in a tight list
  - Tech line in small italic below bullets
  - `break-inside: avoid` so a role doesn't split across pages
- Education + certifications at the bottom.
- Footer: small line with `digitalseraph.com · generated <date>`.

### 6.3 Target page count

Aim for **2 pages**. The existing PDF at `DavidMiller_Resume_2026.pdf` uses 3; we can compress by tightening type (body at 9.5pt, bullets at 9pt, headers at 11pt).

### 6.4 Testing

Playwright E2E with `page.emulateMedia({ media: 'print' })` then a full-page screenshot; compare against a committed baseline PNG with a small pixel-diff tolerance to catch regressions.

---

## 7. Component architecture

All new files go under `app/components/resume/` in the `digitalseraph-vue` repo.

```
app/
├── components/
│   └── resume/
│       ├── ResumeTerminal.vue       # orchestrator; state + dispatcher
│       ├── ResumeSidebar.vue        # clickable command list
│       ├── ResumeBuffer.vue         # scrollable output container
│       ├── ResumePrompt.vue         # $ prefix + input + cursor
│       ├── ResumeEntry.vue          # single buffer entry (input echo + output slot)
│       ├── outputs/
│       │   ├── WhoamiBlock.vue
│       │   ├── SummaryBlock.vue
│       │   ├── ExperienceList.vue
│       │   ├── SkillsGrid.vue
│       │   ├── EducationBlock.vue
│       │   ├── ContactBlock.vue
│       │   └── HelpBlock.vue
│       └── ResumePrintView.vue      # print-only layout
├── composables/
│   └── useResume.ts                 # loads and caches resume.yml
└── pages/
    └── resume.vue                   # replaces the Plan 1 stub
```

### 7.1 Data loading

`useResume()` returns a typed `Ref<Resume>` populated from `content/resume.yml`. Implementation path: prefer `queryCollection("resume")` if @nuxt/content v3 can treat a single `.yml` as a collection; otherwise fetch via `$fetch('/api/resume')` backed by a tiny server route that reads and parses the YAML at build time. Decide at implementation after a 5-minute spike.

### 7.2 Command dispatcher

`ResumeTerminal.vue` holds:

```ts
type OutputEntry =
  | { kind: 'text'; text: string }
  | { kind: 'component'; name: keyof typeof outputMap }
  | { kind: 'clear' }
  | null;  // no-op; use for side-effect-only commands like `pdf`

const commands: Record<string, (resume: Resume) => OutputEntry> = {
  whoami: () => ({ kind: 'component', name: 'WhoamiBlock' }),
  'cat summary.md': (r) => ({ kind: 'text', text: r.summary }),
  'cat experience.md': () => ({ kind: 'component', name: 'ExperienceList' }),
  'ls skills/': () => ({ kind: 'component', name: 'SkillsGrid' }),
  'cat education.md': () => ({ kind: 'component', name: 'EducationBlock' }),
  contact: () => ({ kind: 'component', name: 'ContactBlock' }),
  help: () => ({ kind: 'component', name: 'HelpBlock' }),
  '?': () => ({ kind: 'component', name: 'HelpBlock' }),
  clear: () => ({ kind: 'clear' }),
  pdf: () => { window.print(); return null; },
};
```

Unknown commands get a literal `text` entry with the "command not found" line.

### 7.3 Buffer state

```ts
interface BufferEntry {
  id: string;          // nanoid or Date.now() + counter
  input: string;       // the command string as echoed
  output: OutputEntry; // what renders below the echoed input
}
const buffer = ref<BufferEntry[]>([]);
```

`clear` replaces buffer with `[]`. On mount, the intro auto-pushes a `whoami` entry.

### 7.4 Accessibility

- Buffer container: `role="log"` + `aria-live="polite"` so screen readers announce new output without interrupting in-flight speech.
- Prompt input: `aria-label="Resume terminal prompt — type a command and press Enter"`.
- Sidebar: `role="navigation"` + `aria-label="Résumé sections"`.
- Print view uses plain semantic HTML (h1, h2, p, ul, li). When `@media print` activates, the terminal gets `aria-hidden="true"` (it's hidden anyway, but belt-and-suspenders).
- Skip link (already in AppLayout) points at `#main`; `ResumeTerminal` is inside `<main>`.

---

## 8. Testing

### 8.1 Unit (Vitest)

- `useResume()` — parses YAML, returns typed shape, handles missing optional fields.
- Command dispatcher — every command in the table produces the expected `OutputEntry`. Unknown commands produce the "command not found" text. Case/whitespace normalization works.
- Buffer reducer — clear wipes; new entries append; interrupt completes previous entry instantly.

### 8.2 Component (@nuxt/test-utils)

- `ResumeTerminal` mounts, runs the `whoami` intro, buffer contains exactly one entry after intro completes.
- Clicking a sidebar entry appends a new buffer entry.
- Typing a command + Enter appends a new buffer entry, input clears, focus stays.
- `clear` empties the buffer.
- `pdf` calls `window.print` (mocked) and leaves the buffer untouched.

### 8.3 E2E (Playwright)

- Cold-load `/resume` — assert `whoami` typed to completion within 2500 ms.
- Sidebar click → `cat experience.md` → each of the 10 roles renders (assert presence of role titles).
- Type `clear` in the prompt → buffer empties.
- Type `unknowncmd` → `command not found: unknowncmd` appears.
- Emulate `prefers-reduced-motion: reduce` → intro completes instantly (no typing wait), bulk output is single-frame.
- `page.emulateMedia({ media: 'print' })` → screenshot the print view, compare against the committed baseline.

### 8.4 Manual verification

- Keyboard-only: Tab order reaches sidebar, then prompt, then footer.
- Mobile viewport (390px): chips are horizontally scrollable, input stays pinned bottom.
- Screen reader (VoiceOver or NVDA): new output announcements are clear and non-interrupting.

---

## 9. Open questions (decide during implementation)

1. **YAML loading path** — `queryCollection` + custom collection vs `$fetch` from a tiny server endpoint vs import at build time. 5-minute spike during Task 1 of the plan.
2. **Print view baseline screenshot** — capture once, commit under `tests/e2e/fixtures/`. If it drifts, the test fails loudly and we reset the baseline deliberately.
3. **Touch-device cursor** — on mobile the blinking cursor might feel weird given there's no visible keyboard flow; revisit after first render on a real phone.

---

## 10. Out of scope for v1 (future work)

- Command history (↑/↓ to recall previous commands in the current session)
- Tab completion
- `ls experience/` / `cat experience/<company>.md` for per-role detail pages
- Filtering (e.g., `cat experience.md --since 2020`)
- Export formats beyond PDF (no DOCX, no JSON Resume)
