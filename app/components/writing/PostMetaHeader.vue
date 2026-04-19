<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    date: string;
    readingMinutes: number;
    kicker?: string;
  }>(),
  { kicker: "$ writing/" }
);

const formatted = computed(() =>
  new Date(props.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
);
</script>

<template>
  <div>
    <div
      class="font-mono text-[var(--text-mono)] text-[var(--accent)] uppercase tracking-[0.15em] mb-2"
    >
      {{ kicker }}
    </div>
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
      {{ formatted }}
      <span class="mx-2">·</span>
      {{ readingMinutes }} min read
    </div>
  </div>
</template>
