<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import PostMetaHeader from "~/components/writing/PostMetaHeader.vue";
import PostMetaTags from "~/components/writing/PostMetaTags.vue";
import PostNav from "~/components/writing/PostNav.vue";
import ReadingProgress from "~/components/writing/ReadingProgress.vue";
import { readingMinutes } from "~/utils/readingTime";
import { getPostSiblings } from "~/utils/postNav";
import { useArrowNav } from "~/composables/useArrowNav";

const route = useRoute();
const router = useRouter();
const slug = route.params.slug as string;

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection("writing").where("stem", "=", `writing/${slug}`).first()
);
if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Post not found", fatal: true });
}

const { data: allPosts } = await useAsyncData("all-writing-for-nav", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

const siblings = computed(() =>
  getPostSiblings(allPosts.value ?? [], `writing/${slug}`)
);

useArrowNav({
  prev: () => {
    if (siblings.value.prev) router.push(`/writing/${siblings.value.prev.slug}`);
  },
  next: () => {
    if (siblings.value.next) router.push(`/writing/${siblings.value.next.slug}`);
  },
});

// @nuxt/content stores body as an AST. JSON.stringify + whitespace-split gives
// a rough word count sufficient for a "min read" estimate. Swap for an AST
// walker later if the estimate skews wildly once real posts land.
const reading = computed(() => {
  const bodyText = post.value?.body ? JSON.stringify(post.value.body) : "";
  return readingMinutes(bodyText);
});

useHead(() => ({
  title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph",
}));
</script>

<template>
  <ReadingProgress />
  <article v-if="post" class="max-w-2xl mx-auto px-8 py-24">
    <PostMetaHeader :date="post.date" :reading-minutes="reading" />

    <h1
      class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-4 mt-2"
    >
      {{ post.title }}
    </h1>

    <PostMetaTags :tags="post.tags ?? []" class="mb-10" />

    <div class="prose prose-invert max-w-none">
      <ContentRenderer :value="post" />
    </div>

    <PostNav class="mt-16" :prev="siblings.prev" :next="siblings.next" />
  </article>
</template>
