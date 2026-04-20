<script setup lang="ts">
import { ref } from "vue";
import TheNavBar from "./TheNavBar.vue";
import TheFooter from "./TheFooter.vue";
import TheCommandPalette from "./TheCommandPalette.vue";
import ScrollRail from "./ScrollRail.vue";
import { useCommandKey } from "~/composables/useKeyboard";
import { useMotionStore } from "~/stores/motion";

const paletteOpen = ref(false);
useCommandKey(() => { paletteOpen.value = !paletteOpen.value; });

const motion = useMotionStore();
if (typeof window !== "undefined") motion.init();
</script>

<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-[var(--canvas-raised)] focus:text-[var(--accent)] focus:px-3 focus:py-2 focus:rounded">
    skip to content
  </a>
  <TheNavBar @toggle-palette="paletteOpen = !paletteOpen" />
  <ScrollRail />
  <main id="main" class="pt-12">
    <slot />
  </main>
  <TheFooter />
  <TheCommandPalette :open="paletteOpen" @close="paletteOpen = false" />
</template>
