<script setup lang="ts">
import { computed } from "vue";
import { fmtPostDate } from "~/utils/postDate";

const props = withDefaults(
  defineProps<{
    date: string;
    readingMinutes: number;
    kicker?: string;
  }>(),
  { kicker: "$ writing/" }
);

const formatted = computed(() => fmtPostDate(props.date));
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
