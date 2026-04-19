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
