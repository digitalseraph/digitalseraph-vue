<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useScrollY } from "~/composables/useScrollY";

// The progress bar uses the DOCUMENT's total scroll range as denominator,
// not the article's — so it's a simple global indicator. A per-article version
// would need a target ref; this one just says "how far down the page am I".

const scrollY = useScrollY();
const maxScroll = ref(1);

function recalc() {
  if (typeof document === "undefined") return;
  const doc = document.documentElement;
  maxScroll.value = Math.max(1, doc.scrollHeight - doc.clientHeight);
}

const progress = computed(() => Math.min(1, Math.max(0, scrollY.value / maxScroll.value)));

onMounted(() => {
  recalc();
  window.addEventListener("resize", recalc);
});
onBeforeUnmount(() => {
  window.removeEventListener("resize", recalc);
});
</script>

<template>
  <div
    class="fixed left-0 right-0 z-30 h-[2px] pointer-events-none"
    style="top: 48px"
    aria-hidden="true"
  >
    <div
      class="h-full bg-[var(--accent)] origin-left transition-transform duration-75 ease-out"
      :style="{ transform: `scaleX(${progress})` }"
    ></div>
  </div>
</template>
