<script setup lang="ts">
const items = [
  "Vue 3", "TypeScript", "Nuxt", "Pinia", "PHP", "Laravel", "Node.js",
  "React", "Next.js", "Ruby on Rails", ".NET", "C#",
  "AWS", "GKE", "Kubernetes", "Docker", "Skaffold", "HashiCorp Vault",
  "MySQL", "PostgreSQL", "Redis", "ElasticSearch",
  "Vitest", "Playwright", "PHPUnit", "Jest",
  "HIPAA", "12-Factor", "TDD", "CI/CD",
];

// Second row — complementary tech grouped by theme (DevOps / Testing / Tooling)
const items2 = [
  "git", "GitHub Actions", "GitLab", "BitBucket",
  "Storybook", "Adobe XD", "Vite", "Webpack", "pnpm", "Composer",
  "New Relic", "DataDog", "Sentry", "SonarQube",
  "Azure", "MSAL", "Microsoft Graph", "SharePoint",
  "Bootstrap", "Tailwind", "SASS", "jQuery",
  "Linux", "Bash", "SSH",
];

const track1 = [...items, ...items];
const track2 = [...items2, ...items2];
</script>

<template>
  <div class="relative overflow-hidden border-y border-[var(--line)] bg-[var(--canvas-raised)] py-3 space-y-1" aria-hidden="true">
    <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--canvas-raised)] to-transparent z-10 pointer-events-none"></div>
    <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--canvas-raised)] to-transparent z-10 pointer-events-none"></div>

    <ul class="marquee-track marquee-left flex items-center gap-10 whitespace-nowrap font-mono text-[var(--text-mono)]">
      <li v-for="(item, i) in track1" :key="`a-${i}`" class="flex items-center gap-10">
        <span class="text-[var(--text-muted)]">{{ item }}</span>
        <span class="marquee-sep text-[var(--accent)] select-none" :style="{ '--flick-delay': `${(i * 137) % 7000}ms` }" aria-hidden="true">·</span>
      </li>
    </ul>

    <ul class="marquee-track marquee-right flex items-center gap-10 whitespace-nowrap font-mono text-[var(--text-mono)]">
      <li v-for="(item, i) in track2" :key="`b-${i}`" class="flex items-center gap-10">
        <span class="text-[var(--text-muted)]">{{ item }}</span>
        <span class="marquee-sep text-[var(--accent)] select-none" :style="{ '--flick-delay': `${(i * 211 + 450) % 7000}ms` }" aria-hidden="true">·</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@keyframes marquee-scroll-left {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
@keyframes marquee-scroll-right {
  from { transform: translate3d(-50%, 0, 0); }
  to { transform: translate3d(0, 0, 0); }
}
.marquee-track {
  width: max-content;
}
.marquee-left {
  animation: marquee-scroll-left 60s linear infinite;
}
.marquee-right {
  animation: marquee-scroll-right 75s linear infinite;
}
@keyframes sep-flicker {
  0%, 88%, 100% { opacity: 1; }
  90% { opacity: 0.25; }
  92% { opacity: 0.85; }
  94% { opacity: 0.35; }
  96% { opacity: 1; }
}
.marquee-sep {
  animation: sep-flicker 7s ease-in-out infinite;
  animation-delay: var(--flick-delay);
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track { animation: none; }
  .marquee-sep { animation: none; }
}
</style>
