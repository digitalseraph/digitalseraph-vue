<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";

const props = defineProps<{ entryCount: number }>();

const emit = defineEmits<{ (e: "focus-input"): void }>();

const scrollEl = ref<HTMLElement | null>(null);
const autoScroll = ref(true);
const showJumpPill = ref(false);
const JUMP_THRESHOLD = 100;

function onScroll() {
  const el = scrollEl.value;
  if (!el) return;
  const distFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
  if (distFromBottom > JUMP_THRESHOLD) {
    autoScroll.value = false;
    showJumpPill.value = true;
  } else {
    autoScroll.value = true;
    showJumpPill.value = false;
  }
}

function jumpToBottom() {
  const el = scrollEl.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

watch(() => props.entryCount, async () => {
  await nextTick();
  if (autoScroll.value) jumpToBottom();
});

onMounted(jumpToBottom);

function focusInput() {
  emit("focus-input");
}
</script>

<template>
  <div class="relative flex-1 overflow-hidden">
    <div
      ref="scrollEl"
      @scroll="onScroll"
      @click="focusInput"
      tabindex="-1"
      role="log"
      aria-live="polite"
      aria-label="Résumé terminal output"
      class="h-full overflow-y-auto pr-2 font-mono text-[var(--text-mono)] leading-relaxed focus:outline-none"
    >
      <slot />
    </div>
    <button
      v-if="showJumpPill"
      type="button"
      @click="jumpToBottom"
      class="absolute bottom-2 right-2 font-mono text-xs px-3 py-1 rounded-full bg-[var(--canvas-raised)] border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--canvas)] transition-colors"
    >↓ jump to latest</button>
  </div>
</template>
