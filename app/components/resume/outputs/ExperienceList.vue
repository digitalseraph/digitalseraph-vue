<script setup lang="ts">
const resume = await useResume();
const experience = computed(() => resume.value?.experience ?? []);

function fmtDate(d: string): string {
  if (d === "present") return "present";
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
