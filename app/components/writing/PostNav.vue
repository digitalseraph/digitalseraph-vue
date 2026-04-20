<script setup lang="ts">
import type { PostRef } from "~/types/postNav";

defineProps<{
  prev?: PostRef | null;
  next?: PostRef | null;
}>();
</script>

<template>
  <div>
    <nav
      v-if="prev || next"
      aria-label="Post navigation"
      class="pt-6 border-t border-[var(--line)] flex items-center justify-between gap-6 font-mono text-[var(--text-mono)]"
    >
      <NuxtLink
        v-if="prev"
        :to="`/writing/${prev.slug}`"
        class="group min-w-0 max-w-[48%] truncate text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <span class="text-[var(--text-dim)]"><span aria-hidden="true">← </span>previous ·</span>
        <span class="ml-1">{{ prev.title }}</span>
      </NuxtLink>
      <span v-else class="flex-1"></span>

      <NuxtLink
        v-if="next"
        :to="`/writing/${next.slug}`"
        class="group min-w-0 max-w-[48%] truncate text-right text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
      >
        <span>{{ next.title }}</span>
        <span class="text-[var(--text-dim)] ml-1">· next<span aria-hidden="true"> →</span></span>
      </NuxtLink>
      <span v-else class="flex-1"></span>
    </nav>
    <div v-if="prev || next" class="mt-3 font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
      <kbd class="px-1 border border-[var(--line)] rounded-sm">k</kbd> prev ·
      <kbd class="px-1 border border-[var(--line)] rounded-sm">j</kbd> next
    </div>
  </div>
</template>
