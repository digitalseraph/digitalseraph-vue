<script setup lang="ts">
import { ref, onMounted, watch, toRef } from "vue";
import { useTerminalHistory } from "~/composables/useTerminalHistory";
import { getCompletions } from "~/utils/tabComplete";

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
  username?: string;
  history?: string[];
  commands?: string[];
  projectSlugs?: string[];
  postSlugs?: string[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: string): void;
  (e: "submit", v: string): void;
  (e: "candidates", v: string[]): void;
}>();

const inputEl = ref<HTMLInputElement | null>(null);

const historyRef = toRef(() => props.history ?? []);
const nav = useTerminalHistory(historyRef);

function focus() {
  inputEl.value?.focus();
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Enter") {
    e.preventDefault();
    nav.reset();
    emit("submit", props.modelValue);
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    nav.up();
    emit("update:modelValue", nav.currentEntry.value ?? "");
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    nav.down();
    emit("update:modelValue", nav.currentEntry.value ?? "");
    return;
  }
  if (e.key === "Tab") {
    e.preventDefault();
    const { completion, candidates } = getCompletions(props.modelValue, {
      commands: props.commands ?? [],
      projects: props.projectSlugs ?? [],
      posts: props.postSlugs ?? [],
    });
    if (completion !== null) {
      emit("update:modelValue", completion);
    } else if (candidates.length > 0) {
      emit("candidates", candidates);
    }
    return;
  }
}

onMounted(focus);
watch(() => props.disabled, (d) => { if (!d) focus(); });

defineExpose({ focus });
</script>

<template>
  <div class="flex items-center gap-2 font-mono text-[var(--text-mono-l)] border-t border-[var(--line)] pt-3">
    <span class="font-mono text-[var(--accent)] select-none">{{ username || "user" }}</span>
    <span class="font-mono text-[var(--text-muted)] select-none">@digitalseraph</span>
    <span class="font-mono text-[var(--text-dim)] select-none">:</span>
    <span class="font-mono text-[var(--text-muted)] select-none">~</span>
    <span class="font-mono text-[var(--accent)] select-none">$</span>
    <input
      ref="inputEl"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      @keydown="onKey"
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
