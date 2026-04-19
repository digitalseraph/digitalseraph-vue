<script setup lang="ts">
const resume = useResume();
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
