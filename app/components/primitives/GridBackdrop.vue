<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const props = withDefaults(defineProps<{ speed?: number; glow?: boolean; cursorGlow?: boolean }>(), {
  speed: 0.1,
  glow: true,
  cursorGlow: true,
});

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform } = useParallax({ speed: props.speed, reduced });

const cursorGlowEl = ref<HTMLElement | null>(null);
let mouseX = 0, mouseY = 0;
let currX = 0, currY = 0;
let rafId: number | null = null;
let active = false;

function onMouseMove(e: MouseEvent) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  if (!active) tick();
}

function tick() {
  active = true;
  currX += (mouseX - currX) * 0.08;
  currY += (mouseY - currY) * 0.08;
  if (cursorGlowEl.value) {
    cursorGlowEl.value.style.transform = `translate(${currX - 200}px, ${currY - 200}px)`;
  }
  const dx = Math.abs(mouseX - currX);
  const dy = Math.abs(mouseY - currY);
  if (dx < 0.5 && dy < 0.5) {
    active = false;
    return;
  }
  rafId = requestAnimationFrame(tick);
}

onMounted(() => {
  if (!props.cursorGlow || reduced.value) return;
  // Skip on touch-only / no-pointer devices
  if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return;
  window.addEventListener("mousemove", onMouseMove, { passive: true });
  // Seed position to viewport center so first paint isn't in corner
  mouseX = window.innerWidth / 2;
  mouseY = window.innerHeight / 2;
  currX = mouseX;
  currY = mouseY;
  tick();
});

onBeforeUnmount(() => {
  window.removeEventListener("mousemove", onMouseMove);
  if (rafId !== null) cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <div class="absolute inset-0 grid-lines" :style="{ transform }"></div>
    <div v-if="glow" class="absolute -top-1/4 -right-1/4 w-[60%] h-[60%] glow-radial"></div>
    <div
      v-if="cursorGlow"
      ref="cursorGlowEl"
      class="fixed pointer-events-none cursor-glow w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 mix-blend-screen opacity-60"
      style="left: 0; top: 0;"
    ></div>
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
.cursor-glow {
  background: radial-gradient(circle, var(--accent-glow) 0%, transparent 60%);
  will-change: transform;
}
@media (prefers-reduced-motion: reduce), (pointer: coarse) {
  .cursor-glow { display: none; }
}
</style>
