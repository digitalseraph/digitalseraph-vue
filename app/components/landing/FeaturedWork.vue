<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import ProjectCard from "~/components/primitives/ProjectCard.vue";

const { data: projects } = await useAsyncData("featured-work", () =>
  queryCollection("work").where("featured", "=", true).order("year", "DESC").all()
);

function slugOf(stem: string) {
  return stem.split('/').pop() ?? '';
}
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls work/ --featured</div>
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">selected work</h2>
      </div>
      <NuxtLink to="/work" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">view all →</NuxtLink>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ProjectCard
        v-for="p in projects ?? []"
        :key="p.id"
        :slug="slugOf(p.stem)"
        :title="p.title"
        :year="p.year"
        :role="p.role"
        :summary="p.summary"
        :stack="p.stack"
        :cover="p.cover"
      />
    </div>
  </SectionReveal>
</template>
