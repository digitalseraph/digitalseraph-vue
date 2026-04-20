<script setup lang="ts">
interface DirEntry {
  name: string;
  kind: "file" | "dir";
  link?: string;
}

defineProps<{ items: DirEntry[] }>();
</script>

<template>
  <div class="flex flex-wrap gap-x-6 gap-y-1 font-mono text-sm">
    <template v-for="item in items" :key="item.name">
      <NuxtLink
        v-if="item.link"
        :to="item.link"
        class="hover:underline"
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}</NuxtLink>
      <span
        v-else
        :class="item.kind === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text)]'"
      >{{ item.name }}</span>
    </template>
  </div>
</template>
