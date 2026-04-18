<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const router = useRouter();
const query = ref("");
const selected = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

const routes = [
  { label: "home", path: "/" },
  { label: "about", path: "/about" },
  { label: "work", path: "/work" },
  { label: "resume", path: "/resume" },
  { label: "writing", path: "/writing" },
  { label: "contact", path: "/contact" },
];

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return routes;
  return routes.filter((r) => r.label.includes(q));
});

watch(
  () => props.open,
  async (v) => {
    if (v) {
      query.value = "";
      selected.value = 0;
      await nextTick();
      inputEl.value?.focus();
    }
  }
);

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
  if (e.key === "ArrowDown") {
    e.preventDefault();
    if (filtered.value.length === 0) return;
    selected.value = (selected.value + 1) % filtered.value.length;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (filtered.value.length === 0) return;
    selected.value = (selected.value - 1 + filtered.value.length) % filtered.value.length;
  }
  if (e.key === "Enter") {
    const pick = filtered.value[selected.value];
    if (pick) { router.push(pick.path); emit("close"); }
  }
}

watch(filtered, (list) => {
  if (list.length === 0) {
    selected.value = 0;
    return;
  }
  if (selected.value >= list.length) selected.value = list.length - 1;
  if (selected.value < 0) selected.value = 0;
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/60 flex items-start justify-center pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      @click.self="emit('close')"
      @keydown="onKey"
    >
      <div class="w-full max-w-xl mx-4 bg-[var(--canvas-raised)] border border-[var(--line)] rounded-lg shadow-2xl font-mono">
        <div class="px-4 py-3 border-b border-[var(--line)] flex items-center gap-2">
          <span class="text-[var(--accent)]">❯</span>
          <input
            ref="inputEl"
            v-model="query"
            type="text"
            class="flex-1 bg-transparent outline-none text-[var(--text)] placeholder:text-[var(--text-dim)]"
            placeholder="type to filter…"
            autocomplete="off"
          />
          <span class="text-[var(--text-dim)] text-xs">esc</span>
        </div>
        <ul class="max-h-80 overflow-y-auto p-2">
          <li
            v-for="(r, i) in filtered"
            :key="r.path"
            :class="[
              'px-3 py-2 rounded cursor-pointer',
              i === selected ? 'bg-[var(--line)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]',
            ]"
            @mouseenter="selected = i"
            @click="() => { $router.push(r.path); emit('close'); }"
          >
            <span class="text-[var(--text-dim)]">/ </span>{{ r.label }}
          </li>
          <li v-if="filtered.length === 0" class="px-3 py-2 text-[var(--text-dim)]">no matches</li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>
