<script setup lang="ts">
import { computed } from "vue";
import PostCard from "~/components/primitives/PostCard.vue";
import { stemToSlug } from "~/utils/slug";

const { data: posts } = await useAsyncData("all-writing", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

const postsByYear = computed(() => {
  type Post = NonNullable<typeof posts.value>[number];
  const out = new Map<string, Post[]>();
  for (const p of posts.value ?? []) {
    const year = p.date.slice(0, 4);
    if (!out.has(year)) out.set(year, []);
    out.get(year)!.push(p);
  }
  return Array.from(out.entries()); // [['2026', [...]], ['2025', [...]]]
});

useSeoMeta({
  title: "Writing — digitalseraph",
  ogTitle: "Writing — digitalseraph",
  ogDescription: "Occasional notes on engineering, systems, and shipping.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});

useHead({
  link: [
    { rel: "alternate", type: "application/rss+xml", title: "digitalseraph writing", href: "/feed.xml" },
  ],
});
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ls writing/</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">writing</h1>

    <div v-for="[year, yearPosts] in postsByYear" :key="year" class="mb-12">
      <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase mb-2">
        ~/writing/{{ year }}/
      </div>
      <div>
        <PostCard
          v-for="p in yearPosts"
          :key="p.id"
          :slug="stemToSlug(p.stem)"
          :title="p.title"
          :date="p.date"
          :excerpt="p.excerpt"
          :tags="p.tags"
          heading-level="h2"
        />
      </div>
    </div>
  </section>
</template>
