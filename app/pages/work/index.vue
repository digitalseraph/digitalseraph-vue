<script setup lang="ts">
import ProjectCard from "~/components/primitives/ProjectCard.vue";
import { stemToSlug } from "~/utils/slug";

const { data: projects } = await useAsyncData("all-work", () =>
  queryCollection("work").order("year", "DESC").all()
);

useSeoMeta({
  title: "Work — digitalseraph",
  ogTitle: "Work — digitalseraph",
  ogDescription: "Selected production work — platforms, migrations, and in-house builds replacing expensive SaaS.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <section class="max-w-[1280px] mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls work/</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">work</h1>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="p in projects ?? []"
        :key="p.id"
        :slug="stemToSlug(p.stem)"
        :title="p.title"
        :year="p.year"
        :role="p.role"
        :summary="p.summary"
        :stack="p.stack"
        :cover="p.cover"
        heading-level="h2"
      />
    </div>
  </section>
</template>
