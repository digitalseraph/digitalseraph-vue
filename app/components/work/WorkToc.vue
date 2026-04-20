<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import type { Heading } from "~/utils/extractHeadings";

const props = defineProps<{ headings: Heading[] }>();

const activeId = ref<string>("");

let observer: IntersectionObserver | null = null;

onMounted(() => {
  if (props.headings.length === 0 || typeof window === "undefined") return;
  const els = props.headings
    .map((h) => document.getElementById(h.id))
    .filter((el): el is HTMLElement => el !== null);
  if (els.length === 0) return;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id;
        }
      }
    },
    {
      // Trigger when heading crosses upper third of viewport
      rootMargin: "0px 0px -66% 0px",
      threshold: 0,
    }
  );

  for (const el of els) observer.observe(el);
});

onBeforeUnmount(() => {
  observer?.disconnect();
});
</script>

<template>
  <aside v-if="headings.length > 0" aria-label="On this page" class="font-mono text-[var(--text-mono)]">
    <div class="text-[var(--text-dim)] tracking-[0.2em] uppercase mb-3">$ ls sections/</div>
    <ul class="space-y-2">
      <li v-for="h in headings" :key="h.id" :class="{ 'pl-4': h.depth === 3 }">
        <a
          :href="`#${h.id}`"
          :class="[
            'block py-0.5 transition-colors hover:text-[var(--accent)]',
            activeId === h.id ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]',
          ]"
        >{{ h.text }}</a>
      </li>
    </ul>
  </aside>
</template>
