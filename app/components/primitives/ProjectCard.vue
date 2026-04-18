<script setup lang="ts">
import TagChip from "./TagChip.vue";

defineProps<{
  slug: string;
  title: string;
  year: number;
  role: string;
  summary: string;
  stack: string[];
  cover?: string;
}>();
</script>

<template>
  <NuxtLink
    :to="`/work/${slug}`"
    class="group block rounded-md border border-[var(--line)] bg-[var(--canvas-raised)] p-5 transition-colors hover:border-[var(--accent)]"
  >
    <div v-if="cover" class="mb-4 aspect-[16/9] overflow-hidden rounded-sm bg-[var(--canvas)]">
      <img :src="cover" :alt="''" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
    </div>
    <div class="flex items-baseline justify-between mb-1">
      <h3 class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)]">{{ title }}</h3>
      <span class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">{{ year }}</span>
    </div>
    <p class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] mb-3">{{ role }}</p>
    <p class="text-[var(--text-muted)] mb-4">{{ summary }}</p>
    <div class="flex flex-wrap gap-1.5">
      <TagChip v-for="s in stack" :key="s">{{ s }}</TagChip>
    </div>
  </NuxtLink>
</template>
