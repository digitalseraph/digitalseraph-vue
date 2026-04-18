<script setup lang="ts">
defineProps<{ href: string; external?: boolean }>();
</script>

<template>
  <a
    :href="href"
    :target="external ? '_blank' : undefined"
    :rel="external ? 'noopener noreferrer' : undefined"
    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-[var(--line)] text-[var(--text)] text-sm hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
  >
    <slot />
  </a>
</template>
