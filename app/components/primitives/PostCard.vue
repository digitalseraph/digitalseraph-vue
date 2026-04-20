<script setup lang="ts">
import { fmtPostDate } from "~/utils/postDate";
import TagChip from "./TagChip.vue";

const props = defineProps<{
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  headingLevel?: "h2" | "h3";
}>();

const tag = props.headingLevel ?? "h3";

const formatted = fmtPostDate(props.date);
</script>

<template>
  <NuxtLink
    :to="`/writing/${slug}`"
    class="group block border-t border-[var(--line)] py-6 pl-0 hover:pl-4 relative transition-[padding] duration-200"
  >
    <span class="absolute left-0 top-6 bottom-6 w-[2px] bg-[var(--accent)] scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-top" aria-hidden="true"></span>
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-2">{{ formatted }}</div>
    <component :is="tag" class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">{{ title }}</component>
    <p v-if="excerpt" class="text-[var(--text-muted)] mb-3">{{ excerpt }}</p>
    <div v-if="tags && tags.length > 0" class="flex flex-wrap gap-1.5">
      <TagChip v-for="t in tags" :key="t">{{ t }}</TagChip>
    </div>
  </NuxtLink>
</template>
