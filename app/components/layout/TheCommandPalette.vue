<script setup lang="ts">
import { ref, computed, watch, nextTick } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const router = useRouter();
const query = ref("");
const selected = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

interface Entry {
  label: string;
  path: string;
  kind: "page" | "project" | "post";
}

const pageEntries: Entry[] = [
  { label: "home", path: "/", kind: "page" },
  { label: "about", path: "/about", kind: "page" },
  { label: "work", path: "/work", kind: "page" },
  { label: "resume", path: "/resume", kind: "page" },
  { label: "writing", path: "/writing", kind: "page" },
  { label: "contact", path: "/contact", kind: "page" },
];

const { data: projectsData } = useAsyncData("palette-projects", () =>
  queryCollection("work").order("year", "DESC").all()
);
const { data: postsData } = useAsyncData("palette-posts", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

const projectEntries = computed<Entry[]>(() =>
  (projectsData.value ?? []).map((p) => ({
    label: p.title,
    path: `/work/${p.stem.replace(/^work\//, "")}`,
    kind: "project",
  }))
);
const postEntries = computed<Entry[]>(() =>
  (postsData.value ?? []).map((p) => ({
    label: p.title,
    path: `/writing/${p.stem.replace(/^writing\//, "")}`,
    kind: "post",
  }))
);

const all = computed<Entry[]>(() => [
  ...pageEntries,
  ...projectEntries.value,
  ...postEntries.value,
]);

const filtered = computed<Entry[]>(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return all.value;
  return all.value.filter((e) =>
    e.label.toLowerCase().includes(q) || e.path.toLowerCase().includes(q)
  );
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

watch(filtered, () => {
  const len = filtered.value.length;
  if (len === 0) {
    selected.value = 0;
  } else if (selected.value >= len) {
    selected.value = Math.max(0, len - 1);
  }
});

function onKey(e: KeyboardEvent) {
  const len = filtered.value.length;
  if (e.key === "Escape") {
    e.preventDefault();
    emit("close");
    return;
  }
  if (len === 0) return;
  if (e.key === "ArrowDown") {
    e.preventDefault();
    selected.value = (selected.value + 1) % len;
    return;
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    selected.value = (selected.value - 1 + len) % len;
    return;
  }
  if (e.key === "Enter") {
    e.preventDefault();
    const target = filtered.value[selected.value];
    if (target) {
      router.push(target.path);
      emit("close");
    }
  }
}

function pick(entry: Entry) {
  router.push(entry.path);
  emit("close");
}

const kindStyle: Record<Entry["kind"], string> = {
  page: "text-[var(--text-dim)]",
  project: "text-[var(--accent)]",
  post: "text-[var(--accent)]",
};

const kindLabel: Record<Entry["kind"], string> = {
  page: "page",
  project: "project",
  post: "post",
};
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-150"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-[color-mix(in_oklab,var(--canvas)_75%,transparent)] backdrop-blur flex items-start justify-center pt-24 px-6"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-xl rounded-md border border-[var(--line)] bg-[var(--canvas-raised)] shadow-2xl overflow-hidden font-mono"
      >
        <div class="flex items-center gap-2 px-4 py-3 border-b border-[var(--line)] text-[var(--text-mono)]">
          <span class="text-[var(--accent)] select-none">$</span>
          <input
            ref="inputEl"
            v-model="query"
            @keydown="onKey"
            type="text"
            autocomplete="off"
            spellcheck="false"
            class="flex-1 bg-transparent outline-none text-[var(--text)] caret-transparent"
            aria-label="Search pages, projects, and posts"
            placeholder="search…"
          />
          <span class="inline-block w-[7px] h-[14px] bg-[var(--accent)] cursor-blink align-[-2px]" aria-hidden="true"></span>
        </div>

        <ul v-if="filtered.length > 0" class="max-h-[60vh] overflow-y-auto py-2" role="listbox">
          <li
            v-for="(entry, i) in filtered"
            :key="entry.path"
            role="option"
            :aria-selected="i === selected"
            :class="[
              'flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors',
              i === selected ? 'bg-[var(--canvas)]' : 'hover:bg-[var(--canvas)]',
            ]"
            @mouseenter="selected = i"
            @click="pick(entry)"
          >
            <span class="text-[var(--text-mono)] text-[var(--text)]">{{ entry.label }}</span>
            <span class="ml-auto text-[var(--text-mono)] tracking-[0.2em] uppercase" :class="kindStyle[entry.kind]">{{ kindLabel[entry.kind] }}</span>
          </li>
        </ul>
        <div v-else class="px-4 py-6 text-center text-[var(--text-dim)] text-[var(--text-mono)]">
          no results for "{{ query }}"
        </div>

        <div class="px-4 py-2 border-t border-[var(--line)] text-[var(--text-mono)] text-[var(--text-dim)] flex items-center justify-between">
          <span>
            <kbd class="px-1 border border-[var(--line)] rounded-sm">↑↓</kbd> navigate ·
            <kbd class="px-1 border border-[var(--line)] rounded-sm">↵</kbd> open
          </span>
          <span><kbd class="px-1 border border-[var(--line)] rounded-sm">esc</kbd> close</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
</style>
