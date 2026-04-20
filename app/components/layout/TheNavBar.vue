<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useThemeStore } from "~/stores/theme";

const theme = useThemeStore();
const emit = defineEmits<{ (e: "toggle-palette"): void }>();

const hidden = ref(false);
let lastY = 0;

function onScroll() {
  const y = window.scrollY;
  if (y > 80 && y > lastY) hidden.value = true;
  else hidden.value = false;
  lastY = y;
}

onMounted(() => {
  theme.init();
  window.addEventListener("scroll", onScroll, { passive: true });
});
onBeforeUnmount(() => window.removeEventListener("scroll", onScroll));
</script>

<template>
  <nav
    :class="[
      'fixed top-0 inset-x-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--canvas)_85%,transparent)] backdrop-blur transition-transform duration-200',
      hidden ? '-translate-y-full' : 'translate-y-0',
    ]"
    aria-label="Primary"
  >
    <div class="max-w-[1280px] mx-auto px-8 h-12 flex items-center justify-between font-mono text-[var(--text-mono)]">
      <NuxtLink to="/" class="flex items-center gap-2">
        <span class="text-[var(--accent)]">~/digitalseraph.com</span>
        <span class="text-[var(--text-dim)]">❯</span>
      </NuxtLink>
      <ul class="hidden md:flex items-center gap-5 text-[var(--text-muted)]">
        <li><NuxtLink to="/about" class="hover:text-[var(--accent)] transition-colors">about</NuxtLink></li>
        <li><NuxtLink to="/work" class="hover:text-[var(--accent)] transition-colors">work</NuxtLink></li>
        <li><NuxtLink to="/resume" class="text-[var(--accent)] hover:underline underline-offset-4">resume</NuxtLink></li>
        <li><NuxtLink to="/writing" class="hover:text-[var(--accent)] transition-colors">writing</NuxtLink></li>
        <li><NuxtLink to="/contact" class="hover:text-[var(--accent)] transition-colors">contact</NuxtLink></li>
      </ul>
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          aria-label="Open command palette (⌘K)"
          @click="emit('toggle-palette')"
        >⌘K</button>
        <button
          type="button"
          class="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors"
          :aria-label="`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} mode`"
          @click="theme.toggle()"
        >
          <span v-if="theme.mode === 'dark'">◐</span>
          <span v-else>◑</span>
        </button>
      </div>
    </div>
  </nav>
</template>
