<script setup lang="ts">
import TagChip from "~/components/primitives/TagChip.vue";

defineProps<{
  year: number;
  role: string;
  stack: string[];
}>();
</script>

<template>
  <div class="mb-4">
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-4">{{ year }} · {{ role }}</div>
    <div class="flex flex-wrap gap-1.5">
      <TagChip v-for="s in stack" :key="s">{{ s }}</TagChip>
    </div>
  </div>
</template>
