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
