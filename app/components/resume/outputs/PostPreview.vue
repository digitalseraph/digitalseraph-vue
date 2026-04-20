<script setup lang="ts">
const props = defineProps<{ slug: string }>();

const { data: post } = await useAsyncData(
  () => `terminal-post-${props.slug}`,
  () => queryCollection("writing").where("stem", "=", `writing/${props.slug}`).first(),
);
</script>

<template>
  <div v-if="post" class="space-y-2">
    <div class="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
      <h3 class="text-[var(--text)] font-semibold">{{ post.title }}</h3>
      <span class="text-[var(--text-dim)] text-sm">{{ post.date }}</span>
    </div>
    <div v-if="post.tags?.length" class="flex flex-wrap gap-1.5">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="inline-block px-2 py-0.5 rounded-full border border-[var(--line)] text-[var(--text)] text-xs"
      >{{ tag }}</span>
    </div>
    <p class="text-[var(--text-muted)]">{{ post.excerpt }}</p>
    <NuxtLink :to="`/writing/${slug}`" class="inline-block text-[var(--accent)] hover:underline">
      read post →
    </NuxtLink>
  </div>
  <div v-else class="text-[var(--text-dim)]">cat: writing/{{ slug }}.md: No such file or directory</div>
</template>
