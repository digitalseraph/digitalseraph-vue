<script setup lang="ts">
import TagChip from "~/components/primitives/TagChip.vue";

defineProps<{ tags: string[] }>();
</script>

<template>
  <div v-if="tags.length" class="flex flex-wrap gap-1.5">
    <TagChip v-for="tag in tags" :key="tag">{{ tag }}</TagChip>
  </div>
</template>
