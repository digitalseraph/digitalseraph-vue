<script setup lang="ts">
import HeroTerminal from "~/components/landing/HeroTerminal.vue";

useSeoMeta({
  title: "David Miller — digitalseraph.com",
  description: "Engineer, builder, and occasional writer. Selected work, writing, and contact.",
  ogTitle: "David Miller — digitalseraph.com",
  ogDescription: "Senior Full-Stack Engineer · 10+ years · Cox Communications. Selected work, writing, and an interactive résumé terminal.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <HeroTerminal />
  <!-- Below-the-fold sections render as static HTML and hydrate on scroll,
       so their animations don't block the main thread during first load. -->
  <LazyLandingAboutTeaser hydrate-on-visible />
  <LazyLandingFeaturedWork hydrate-on-visible />
  <LazyLandingResumeTeaser hydrate-on-visible />
  <LazyLandingTechMarquee hydrate-on-visible />
  <LazyLandingWritingTeaser hydrate-on-visible />
  <LazyLandingContactCta hydrate-on-visible />
</template>
