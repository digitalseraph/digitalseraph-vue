<script setup lang="ts">
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ speed?: number; glow?: boolean }>(), {
  speed: 0.1,
  glow: true,
});

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform } = useParallax({ speed: props.speed, reduced });
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="absolute inset-0 grid-lines" :style="{ transform }"></div>
    <div v-if="glow" class="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] glow-radial"></div>
  </div>
</template>

<style scoped>
.grid-lines {
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 32px 32px;
  background-position: 0 0;
  will-change: transform;
}
.glow-radial {
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
  will-change: transform;
}
</style>
