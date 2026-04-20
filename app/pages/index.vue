<script setup lang="ts">
import HeroTerminal from "~/components/landing/HeroTerminal.vue";
import AboutTeaser from "~/components/landing/AboutTeaser.vue";
import FeaturedWork from "~/components/landing/FeaturedWork.vue";
import ResumeTeaser from "~/components/landing/ResumeTeaser.vue";
import WritingTeaser from "~/components/landing/WritingTeaser.vue";
import ContactCta from "~/components/landing/ContactCta.vue";

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
  <AboutTeaser />
  <FeaturedWork />
  <ResumeTeaser />
  <WritingTeaser />
  <ContactCta />
</template>
