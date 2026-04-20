<script setup lang="ts">
import PostCard from "~/components/primitives/PostCard.vue";
import { stemToSlug } from "~/utils/slug";

const { data: posts } = await useAsyncData("all-writing", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

useSeoMeta({
  title: "Writing — digitalseraph",
  ogTitle: "Writing — digitalseraph",
  ogDescription: "Occasional notes on engineering, systems, and shipping.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls writing/</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">writing</h1>
    <div>
      <PostCard
        v-for="p in posts ?? []"
        :key="p.id"
        :slug="stemToSlug(p.stem)"
        :title="p.title"
        :date="p.date"
        :excerpt="p.excerpt"
        heading-level="h2"
      />
    </div>
  </section>
</template>
