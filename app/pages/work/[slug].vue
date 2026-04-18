<script setup lang="ts">
const route = useRoute();
const slug = route.params.slug as string;
const { data: project } = await useAsyncData(`work-${slug}`, () =>
  queryCollection("work").where("stem", "=", `work/${slug}`).first()
);
if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found", fatal: true });
}
useHead(() => ({ title: project.value ? `${project.value.title} — digitalseraph` : "digitalseraph" }));
</script>

<template>
  <article v-if="project" class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-3">{{ project.year }} · {{ project.role }}</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">{{ project.title }}</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="project" />
    </div>
  </article>
</template>
