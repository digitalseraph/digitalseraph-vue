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
