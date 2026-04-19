<script setup lang="ts">
const resume = useResume();
const header = computed(() => resume.value?.header);
</script>

<template>
  <div v-if="header" class="space-y-1">
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">name:</span> {{ header.name }}</div>
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">title:</span> {{ header.title }}<span v-if="header.subtitle"> · {{ header.subtitle }}</span></div>
    <div class="text-[var(--text)]"><span class="text-[var(--text-dim)]">location:</span> {{ header.location }}</div>
  </div>
</template>
