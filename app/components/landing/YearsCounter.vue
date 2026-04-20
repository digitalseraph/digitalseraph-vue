<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ to?: number; durationMs?: number; suffix?: string }>(), {
  to: 10,
  durationMs: 900,
  suffix: "+ years",
});

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const value = ref(0);

onMounted(() => {
  if (reduced.value) {
    value.value = props.to;
    return;
  }
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic

  function tick(now: number) {
    const elapsed = now - start;
    const t = Math.min(1, elapsed / props.durationMs);
    value.value = Math.round(props.to * ease(t));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
});
</script>

<template>
  <span><span class="tabular-nums">{{ value }}</span>{{ suffix }}</span>
</template>
