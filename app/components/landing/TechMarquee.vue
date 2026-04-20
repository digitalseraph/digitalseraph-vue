<script setup lang="ts">
const items = [
  "Vue 3", "TypeScript", "Nuxt", "Pinia", "PHP", "Laravel", "Node.js",
  "React", "Next.js", "Ruby on Rails", ".NET", "C#",
  "AWS", "GKE", "Kubernetes", "Docker", "Skaffold", "HashiCorp Vault",
  "MySQL", "PostgreSQL", "Redis", "ElasticSearch",
  "Vitest", "Playwright", "PHPUnit", "Jest",
  "HIPAA", "12-Factor", "TDD", "CI/CD",
];

// Duplicate for seamless loop
const track = [...items, ...items];
</script>

<template>
  <div class="relative overflow-hidden border-y border-[var(--line)] py-4 bg-[var(--canvas-raised)]" aria-hidden="true">
    <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--canvas-raised)] to-transparent z-10 pointer-events-none"></div>
    <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--canvas-raised)] to-transparent z-10 pointer-events-none"></div>
    <ul class="marquee-track flex items-center gap-10 whitespace-nowrap font-mono text-[var(--text-mono)]">
      <li v-for="(item, i) in track" :key="i" class="flex items-center gap-10">
        <span class="text-[var(--text-muted)]">{{ item }}</span>
        <span class="text-[var(--accent)] select-none" aria-hidden="true">·</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@keyframes marquee-scroll {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
.marquee-track {
  width: max-content;
  animation: marquee-scroll 60s linear infinite;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
}
</style>
