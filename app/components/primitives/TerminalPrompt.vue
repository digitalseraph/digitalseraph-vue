<script setup lang="ts">
import { onMounted } from "vue";
import { useTyping } from "~/composables/useTyping";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(
  defineProps<{ command: string; autoStart?: boolean; speed?: number; symbol?: string }>(),
  { autoStart: true, speed: 45, symbol: "$" }
);

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { displayed, start } = useTyping({ text: props.command, speed: props.speed, reduced });

onMounted(() => { if (props.autoStart) start(); });

defineExpose({ start });
</script>

<template>
  <div class="font-mono text-[var(--text-mono-l)]">
    <span class="text-[var(--accent)]">{{ symbol }}</span>
    <span class="ml-2 text-[var(--text)]">{{ displayed }}</span>
    <span class="inline-block w-[7px] h-[14px] align-[-2px] ml-1 bg-[var(--accent)] cursor-blink" aria-hidden="true"></span>
  </div>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
</style>
