<script setup lang="ts">
import { ref } from "vue";
import { useReveal } from "~/composables/useReveal";

withDefaults(defineProps<{ stagger?: number; as?: string }>(), { stagger: 80, as: "section" });

const root = ref<HTMLElement | null>(null);
const { visible } = useReveal(root);
</script>

<template>
  <component :is="as" ref="root" :class="['reveal', { 'is-visible': visible }]" :style="{ '--stagger': `${stagger}ms` }">
    <slot />
  </component>
</template>

<style scoped>
.reveal > * {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 520ms cubic-bezier(0.2, 0.6, 0.2, 1), transform 520ms cubic-bezier(0.2, 0.6, 0.2, 1);
}
.reveal.is-visible > * {
  opacity: 1;
  transform: translateY(0);
}
.reveal.is-visible > *:nth-child(2) { transition-delay: calc(var(--stagger) * 1); }
.reveal.is-visible > *:nth-child(3) { transition-delay: calc(var(--stagger) * 2); }
.reveal.is-visible > *:nth-child(4) { transition-delay: calc(var(--stagger) * 3); }
.reveal.is-visible > *:nth-child(5) { transition-delay: calc(var(--stagger) * 4); }
.reveal.is-visible > *:nth-child(n+6) { transition-delay: calc(var(--stagger) * 5); }

@media (prefers-reduced-motion: reduce) {
  .reveal > * { opacity: 1; transform: none; transition: none; }
}
</style>
