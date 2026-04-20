<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import WorkMetaHeader from "~/components/work/WorkMetaHeader.vue";
import WorkNav from "~/components/work/WorkNav.vue";
import WorkToc from "~/components/work/WorkToc.vue";
import { useArrowNav } from "~/composables/useArrowNav";
import { useHeadingAnchors } from "~/composables/useHeadingAnchors";
import { extractHeadings } from "~/utils/extractHeadings";

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
  const toRef = (p: typeof list[number] | undefined) =>
    p ? { slug: p.stem.replace(/^work\//, ""), title: p.title } : null;
  return {
    prev: toRef(list[idx + 1]),
    next: toRef(list[idx - 1]),
  };
});

const headings = computed(() => extractHeadings(project.value?.body));

useArrowNav({
  prev: () => { if (siblings.value.prev) router.push(`/work/${siblings.value.prev.slug}`); },
  next: () => { if (siblings.value.next) router.push(`/work/${siblings.value.next.slug}`); },
});

const articleRef = ref<HTMLElement | null>(null);
const { toast } = useHeadingAnchors(articleRef);

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
  <section v-if="project" class="max-w-[1280px] mx-auto px-6 md:px-8 py-24">
    <div class="lg:grid lg:grid-cols-[minmax(0,65ch)_240px] lg:gap-12">
      <article ref="articleRef" class="min-w-0">
        <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-6">{{ project.title }}</h1>
        <WorkMetaHeader :year="project.year" :role="project.role" :stack="project.stack" />
        <div class="prose prose-invert max-w-none mt-8">
          <ContentRenderer :value="project" />
        </div>
        <WorkNav class="mt-16" :prev="siblings.prev" :next="siblings.next" />
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
