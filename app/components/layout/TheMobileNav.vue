<script setup lang="ts">
import { ref, watch, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "~/stores/theme";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ (e: "close"): void }>();

const theme = useThemeStore();
const router = useRouter();
const panelRef = ref<HTMLElement | null>(null);
const firstLinkRef = ref<HTMLAnchorElement | null>(null);
let previousFocus: HTMLElement | null = null;

const links = [
  { label: "about", path: "/about", cmd: "cat about.md", accent: false },
  { label: "work", path: "/work", cmd: "ls work/", accent: false },
  { label: "résumé", path: "/resume", cmd: "./resume", accent: true },
  { label: "writing", path: "/writing", cmd: "ls writing/", accent: false },
  { label: "contact", path: "/contact", cmd: "contact", accent: false },
];

function close() {
  emit("close");
}

function onKey(e: KeyboardEvent) {
  if (!props.open) return;
  if (e.key === "Escape") {
    e.preventDefault();
    close();
    return;
  }
  if (e.key === "Tab" && panelRef.value) {
    const focusables = panelRef.value.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last?.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first?.focus();
    }
  }
}

watch(
  () => props.open,
  async (v) => {
    if (v) {
      previousFocus = (document.activeElement as HTMLElement) ?? null;
      document.documentElement.style.overflow = "hidden";
      await nextTick();
      firstLinkRef.value?.focus();
      window.addEventListener("keydown", onKey);
    } else {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus?.();
    }
  }
);

// Close on route change
router.afterEach(() => {
  if (props.open) close();
});

onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  window.removeEventListener("keydown", onKey);
});
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
      ref="panelRef"
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      class="fixed inset-0 z-50 bg-[var(--canvas)] flex flex-col"
    >
      <div class="flex items-center justify-between px-6 h-12 border-b border-[var(--line)] font-mono text-[var(--text-mono)]">
        <span class="text-[var(--text-dim)]">~/digitalseraph.com</span>
        <button
          type="button"
          class="text-[var(--accent)] hover:underline underline-offset-4 py-1.5 px-2 min-h-[24px]"
          aria-label="Close navigation"
          @click="close"
        >$ exit</button>
      </div>

      <nav aria-label="Primary" class="flex-1 overflow-y-auto px-6 py-10">
        <ul class="space-y-6 font-mono">
          <li v-for="(link, i) in links" :key="link.path">
            <NuxtLink
              :ref="(el: any) => { if (i === 0) firstLinkRef = el?.$el ?? el; }"
              :to="link.path"
              class="block group"
              @click="close"
            >
              <span class="block text-[var(--text-dim)] text-sm tracking-[0.2em] uppercase mb-1">$ {{ link.cmd }}</span>
              <span
                class="block font-display text-4xl font-semibold tracking-[-0.02em] transition-colors"
                :class="link.accent ? 'text-[var(--accent)]' : 'text-[var(--text)] group-hover:text-[var(--accent)]'"
              >{{ link.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="px-6 py-6 border-t border-[var(--line)] flex items-center justify-between font-mono text-[var(--text-mono)]">
        <a
          href="mailto:hello@digitalseraph.com"
          class="text-[var(--text-muted)] hover:text-[var(--accent)] py-1.5 min-h-[24px]"
        >hello@digitalseraph.com</a>
        <button
          type="button"
          class="text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors py-1.5 px-2 min-h-[24px]"
          :aria-label="`Switch to ${theme.mode === 'dark' ? 'light' : 'dark'} mode`"
          :aria-pressed="theme.mode === 'light'"
          @click="theme.toggle()"
        >
          <span v-if="theme.mode === 'dark'" aria-hidden="true">○</span>
          <span v-else aria-hidden="true">●</span>
        </button>
      </div>
    </div>
  </Transition>
</template>
