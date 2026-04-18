<script setup lang="ts">
const props = defineProps<{
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags?: string[];
}>();

const formatted = new Date(props.date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
</script>

<template>
  <NuxtLink
    :to="`/writing/${slug}`"
    class="group block border-t border-[var(--line)] py-6 transition-colors hover:border-[var(--accent)]"
  >
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-2">{{ formatted }}</div>
    <h3 class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">{{ title }}</h3>
    <p class="text-[var(--text-muted)]">{{ excerpt }}</p>
  </NuxtLink>
</template>
