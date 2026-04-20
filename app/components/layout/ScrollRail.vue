<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import { useScrollY } from "~/composables/useScrollY";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);

const scrollY = useScrollY();
const maxScroll = ref(1);

function recalc() {
  if (typeof document === "undefined") return;
  const doc = document.documentElement;
  maxScroll.value = Math.max(1, doc.scrollHeight - doc.clientHeight);
}

onMounted(() => {
  recalc();
  window.addEventListener("resize", recalc);
  // Recalc after initial paint in case of late content
  requestAnimationFrame(recalc);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", recalc);
});

const progress = computed(() => Math.min(1, Math.max(0, scrollY.value / maxScroll.value)));
</script>

<template>
  <div
    v-if="!reduced"
    class="fixed top-12 left-0 bottom-0 w-[2px] pointer-events-none z-20"
    aria-hidden="true"
  >
    <!-- Full-length dim track -->
    <div class="absolute inset-0 bg-[var(--line)]"></div>
    <!-- Accent fill, scales from top to scroll progress -->
    <div
      class="absolute inset-0 bg-[var(--accent)] origin-top"
      :style="{ transform: `scaleY(${progress})` }"
    ></div>
  </div>
</template>
