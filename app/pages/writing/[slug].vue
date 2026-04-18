<script setup lang="ts">
import { computed } from "vue";
const route = useRoute();
const slug = route.params.slug as string;
const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("writing").where("stem", "=", `writing/${slug}`).first()
);
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}
useHead(() => ({ title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph" }));

const formatted = computed(() =>
  post.value ? new Date(post.value.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : ""
);
</script>

<template>
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-3">{{ formatted }}</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">{{ post.title }}</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="post" />
    </div>
  </article>
</template>
