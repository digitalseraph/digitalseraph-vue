<script setup lang="ts">
import { ref, watch } from "vue";
import { useTyping } from "~/composables/useTyping";
import { useReveal } from "~/composables/useReveal";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ command: string; speed?: number; color?: "accent" | "dim" }>(), {
  speed: 35,
  color: "accent",
});

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);

const rootRef = ref<HTMLElement | null>(null);
const { visible } = useReveal(rootRef);

// Display the $ prefix + a space, then the typed command. We pre-prepend `$ `
// so the prompt stays visible before typing starts.
const typing = useTyping({ text: props.command, speed: props.speed, reduced });

watch(visible, (v) => {
  if (v && !typing.done.value) typing.start();
});

const colorClass = props.color === "accent" ? "text-[var(--accent)]" : "text-[var(--text-dim)]";
</script>

<template>
  <div
    ref="rootRef"
    :class="['font-mono text-[var(--text-mono)] mb-2 tracking-[0.2em] uppercase', colorClass]"
  >
    <span class="select-none">$&nbsp;</span><span>{{ typing.displayed.value }}</span><span
      v-if="visible && !typing.done.value"
      class="inline-block w-[5px] h-[11px] align-[-1px] ml-1 bg-[var(--accent)] cursor-blink"
      aria-hidden="true"
    ></span>
  </div>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
@media (prefers-reduced-motion: reduce) {
  .cursor-blink { animation: none; opacity: 1; }
}
</style>
