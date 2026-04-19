<script setup lang="ts">
import { ref, onMounted, watch } from "vue";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "submit", v: string): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);

function focus() {
  inputEl.value?.focus();
}

function onEnter(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    emit("submit", props.modelValue);
  }
}

onMounted(focus);
watch(() => props.disabled, (d) => { if (!d) focus(); });

defineExpose({ focus });
</script>

<template>
  <div class="flex items-center gap-2 font-mono text-[var(--text-mono-l)] border-t border-[var(--line)] pt-3">
    <span class="text-[var(--accent)] select-none">$</span>
    <input
      ref="inputEl"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onEnter"
      :disabled="disabled"
      type="text"
      autocomplete="off"
      spellcheck="false"
      class="flex-1 bg-transparent outline-none text-[var(--text)] caret-transparent disabled:opacity-50"
      aria-label="Resume terminal prompt — type a command and press Enter"
    />
    <span
      v-if="!disabled"
      class="inline-block w-[7px] h-[14px] bg-[var(--accent)] cursor-blink align-[-2px]"
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
