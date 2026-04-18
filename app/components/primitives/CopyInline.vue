<script setup lang="ts">
import { ref } from "vue";
const props = defineProps<{ value: string }>();
const copied = ref(false);

async function copy() {
  if (typeof navigator === "undefined") return;
  await navigator.clipboard.writeText(props.value);
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 1400);
}
</script>

<template>
  <button
    type="button"
    @click="copy"
    class="font-mono inline-flex items-center gap-2 underline decoration-dotted underline-offset-4 decoration-[var(--text-dim)] hover:decoration-[var(--accent)] hover:text-[var(--accent)] transition-colors"
    :aria-label="`Copy ${value}`"
  >
    {{ value }}
    <span v-if="copied" class="text-[var(--accent)] text-xs" aria-live="polite">copied</span>
  </button>
</template>
