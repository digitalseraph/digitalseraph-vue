<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import WorkMetaHeader from "~/components/work/WorkMetaHeader.vue";
import WorkNav from "~/components/work/WorkNav.vue";
import { useArrowNav } from "~/composables/useArrowNav";

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

const { data: project } = await useAsyncData(`work-${slug}`, () =>
  queryCollection("work").where("stem", "=", `work/${slug}`).first()
);
if (!project.value) {
  throw createError({ statusCode: 404, statusMessage: "Project not found", fatal: true });
}

const { data: allProjects } = await useAsyncData("all-work-for-nav", () =>
  queryCollection("work").order("year", "DESC").all()
);

const siblings = computed(() => {
  const list = allProjects.value ?? [];
  const idx = list.findIndex((p) => p.stem === `work/${slug}`);
  const toRef = (p: (typeof list)[number] | undefined) =>
    p ? { slug: p.stem.replace(/^work\//, ""), title: p.title } : null;
  return {
    prev: toRef(list[idx + 1]),
    next: toRef(list[idx - 1]),
  };
});

useArrowNav({
  prev: () => {
    if (siblings.value.prev) router.push(`/work/${siblings.value.prev.slug}`);
  },
  next: () => {
    if (siblings.value.next) router.push(`/work/${siblings.value.next.slug}`);
  },
});

useSeoMeta({
  title: () => project.value ? `${project.value.title} — digitalseraph` : "digitalseraph",
  description: () => project.value?.summary ?? "",
  ogTitle: () => project.value ? `${project.value.title} — digitalseraph` : "digitalseraph",
  ogDescription: () => project.value?.summary ?? "",
  ogImage: () => project.value?.cover ? `https://digitalseraph.com${project.value.cover}` : "https://digitalseraph.com/og/site.svg",
  ogType: "article",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <article v-if="project" class="max-w-2xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-6">{{ project.title }}</h1>
    <WorkMetaHeader :year="project.year" :role="project.role" :stack="project.stack" />
    <div class="prose prose-invert max-w-none mt-8">
      <ContentRenderer :value="project" />
    </div>
    <WorkNav class="mt-16" :prev="siblings.prev" :next="siblings.next" />
  </article>
</template>
