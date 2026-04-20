import { ref, computed, type Ref } from "vue";

export function useTerminalHistory(history: Ref<string[]>) {
  const index = ref(-1);

  function up() {
    const len = history.value.length;
    if (len === 0) return;
    if (index.value === -1) {
      index.value = len - 1;
    } else if (index.value > 0) {
      index.value -= 1;
    }
  }

  function down() {
    const len = history.value.length;
    if (index.value === -1) return;
    if (index.value >= len - 1) {
      index.value = -1;
    } else {
      index.value += 1;
    }
  }

  function reset() {
    index.value = -1;
  }

  const currentEntry = computed(() =>
    index.value === -1 ? null : (history.value[index.value] ?? null)
  );

  return { index, up, down, reset, currentEntry };
}
