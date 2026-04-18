<script setup lang="ts">
import PostCard from "~/components/primitives/PostCard.vue";

const { data: posts } = await useAsyncData("all-writing", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

function slugOf(stem: string) {
  return stem.split('/').pop() ?? '';
}

useHead({ title: "Writing — digitalseraph" });
</script>

<template>
  <section class="max-w-2xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-10">writing</h1>
    <div>
      <PostCard
        v-for="p in posts ?? []"
        :key="p.id"
        :slug="slugOf(p.stem)"
        :title="p.title"
        :date="p.date"
        :excerpt="p.excerpt"
      />
    </div>
  </section>
</template>
