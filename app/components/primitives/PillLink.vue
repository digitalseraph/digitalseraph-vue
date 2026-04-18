<script setup lang="ts">
defineProps<{ href: string; external?: boolean }>();
</script>

<template>
  <NuxtLink
    v-if="!external"
    :to="href"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line)] text-[var(--text)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
  >
    <slot />
  </NuxtLink>
  <a
    v-else
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line)] text-[var(--text)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
  >
    <slot />
  </a>
</template>
