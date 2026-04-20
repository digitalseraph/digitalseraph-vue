<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import PostMetaHeader from "~/components/writing/PostMetaHeader.vue";
import PostMetaTags from "~/components/writing/PostMetaTags.vue";
import PostNav from "~/components/writing/PostNav.vue";
import ReadingProgress from "~/components/writing/ReadingProgress.vue";
import WorkToc from "~/components/work/WorkToc.vue";
import { readingMinutes } from "~/utils/readingTime";
import { getPostSiblings } from "~/utils/postNav";
import { extractHeadings } from "~/utils/extractHeadings";
import { useHeadingAnchors } from "~/composables/useHeadingAnchors";
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

const reading = computed(() => {
  const bodyText = post.value?.body ? JSON.stringify(post.value.body) : "";
  return readingMinutes(bodyText);
});

const headings = computed(() => extractHeadings(post.value?.body));

useArrowNav({
  prev: () => { if (siblings.value.prev) router.push(`/writing/${siblings.value.prev.slug}`); },
  next: () => { if (siblings.value.next) router.push(`/writing/${siblings.value.next.slug}`); },
});

const articleRef = ref<HTMLElement | null>(null);
const { toast } = useHeadingAnchors(articleRef);

useHead(() => ({
  title: post.value ? `${post.value.title} — digitalseraph` : "digitalseraph",
  script: post.value
    ? [
        {
          type: "application/ld+json",
          innerHTML: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.value.title,
            datePublished: post.value.date,
            dateModified: post.value.date,
            description: post.value.excerpt,
            author: {
              "@type": "Person",
              name: "David Miller",
              url: "https://digitalseraph.com",
            },
            publisher: {
              "@type": "Person",
              name: "David Miller",
              url: "https://digitalseraph.com",
            },
            mainEntityOfPage: `https://digitalseraph.com/writing/${(route.params as { slug: string }).slug}`,
            keywords: (post.value.tags ?? []).join(", "),
          }),
        },
      ]
    : [],
}));

useSeoMeta({
  title: () => post.value ? `${post.value.title} — digitalseraph` : "digitalseraph",
  description: () => post.value?.excerpt ?? "",
  ogTitle: () => post.value ? `${post.value.title} — digitalseraph` : "digitalseraph",
  ogDescription: () => post.value?.excerpt ?? "",
  ogImage: "https://digitalseraph.com/og/writing.svg",
  ogType: "article",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <ReadingProgress />
  <section v-if="post" class="max-w-[1280px] mx-auto px-6 md:px-8 py-24">
    <div class="lg:grid lg:grid-cols-[minmax(0,65ch)_240px] lg:gap-12">
      <article ref="articleRef" class="min-w-0">
        <PostMetaHeader :date="post.date" :reading-minutes="reading" />
        <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-4 mt-2">
          {{ post.title }}
        </h1>
        <PostMetaTags :tags="post.tags ?? []" class="mb-10" />
        <div class="prose prose-invert max-w-none">
          <ContentRenderer :value="post" />
        </div>
        <PostNav class="mt-16" :prev="siblings.prev" :next="siblings.next" />
      </article>

      <div class="hidden lg:block">
        <div class="sticky top-20">
          <WorkToc :headings="headings" />
        </div>
      </div>
    </div>
  </section>

  <Transition
    enter-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="toast"
      class="fixed bottom-6 right-6 z-40 font-mono text-[var(--text-mono)] bg-[var(--canvas-raised)] border border-[var(--accent)] text-[var(--accent)] px-3 py-2 rounded-md"
      role="status"
      aria-live="polite"
    >{{ toast }}</div>
  </Transition>
</template>
