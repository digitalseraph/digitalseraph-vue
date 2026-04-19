<script setup lang="ts">
import { fmtPostDate } from "~/utils/postDate";

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
    class="group block border-t border-[var(--line)] py-6 transition-colors hover:border-[var(--accent)]"
  >
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-2">{{ formatted }}</div>
    <component :is="tag" class="text-[var(--text-display-m)] font-display font-semibold tracking-[-0.02em] text-[var(--text)] mb-2 group-hover:text-[var(--accent)] transition-colors">{{ title }}</component>
    <p v-if="excerpt" class="text-[var(--text-muted)]">{{ excerpt }}</p>
  </NuxtLink>
</template>
