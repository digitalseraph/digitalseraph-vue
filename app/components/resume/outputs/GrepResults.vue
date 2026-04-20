<script setup lang="ts">
import type { GrepMatch } from "~/utils/resumeDispatcher";

const props = defineProps<{ term: string; matches: GrepMatch[] }>();

function parts(snippet: string): Array<{ text: string; hit: boolean }> {
  if (!props.term) return [{ text: snippet, hit: false }];
  const regex = new RegExp(`(${props.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return snippet.split(regex).map((seg, i) => ({ text: seg, hit: i % 2 === 1 }));
}
</script>

<template>
  <div v-if="matches.length === 0" class="text-[var(--text-dim)]">(no matches)</div>
  <div v-else class="space-y-1 font-mono text-sm">
    <div v-for="(m, i) in matches" :key="i" class="flex gap-3">
      <code class="text-[var(--text-dim)] min-w-[200px]">{{ m.source }}</code>
      <NuxtLink v-if="m.link" :to="m.link" class="text-[var(--text-muted)] hover:underline">
        <template v-for="(p, pi) in parts(m.snippet)" :key="pi">
          <mark v-if="p.hit" class="bg-transparent text-[var(--accent)]">{{ p.text }}</mark>
          <span v-else>{{ p.text }}</span>
        </template>
      </NuxtLink>
      <span v-else class="text-[var(--text-muted)]">
        <template v-for="(p, pi) in parts(m.snippet)" :key="pi">
          <mark v-if="p.hit" class="bg-transparent text-[var(--accent)]">{{ p.text }}</mark>
          <span v-else>{{ p.text }}</span>
        </template>
      </span>
    </div>
  </div>
</template>
