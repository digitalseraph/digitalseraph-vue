<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import PostCard from "~/components/primitives/PostCard.vue";
import { stemToSlug } from "~/utils/slug";

const { data: posts } = await useAsyncData("writing-teaser", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").limit(3).all()
);
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls writing/</div>
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">recent writing</h2>
      </div>
      <NuxtLink to="/writing" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">all posts →</NuxtLink>
    </div>
    <div>
      <PostCard
        v-for="p in posts ?? []"
        :key="p.id"
        :slug="stemToSlug(p.stem)"
        :title="p.title"
        :date="p.date"
        :excerpt="p.excerpt"
      />
    </div>
  </SectionReveal>
</template>
