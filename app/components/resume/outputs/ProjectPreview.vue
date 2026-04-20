<script setup lang="ts">
const props = defineProps<{ slug: string }>();

const { data: project } = await useAsyncData(
  () => `terminal-project-${props.slug}`,
  () => queryCollection("work").where("stem", "=", `work/${props.slug}`).first(),
);
</script>

<template>
  <div v-if="project" class="space-y-2">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 class="text-[var(--text)] font-semibold">{{ project.title }}</h3>
      <span class="text-[var(--text-dim)] text-sm">{{ project.role }} · {{ project.year }}</span>
    </div>
    <div class="flex flex-wrap gap-1.5">
      <span
        v-for="item in project.stack"
        :key="item"
        class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs"
      >{{ item }}</span>
    </div>
    <p class="text-[var(--text-muted)]">{{ project.summary }}</p>
    <NuxtLink :to="`/work/${slug}`" class="inline-block text-[var(--accent)] hover:underline">
      read case study →
    </NuxtLink>
  </div>
  <div v-else class="text-[var(--text-dim)]">cat: projects/{{ slug }}.md: No such file or directory</div>
</template>
