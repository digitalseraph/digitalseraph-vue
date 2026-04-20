<script setup lang="ts">
import HeroTerminal from "~/components/landing/HeroTerminal.vue";
import AboutTeaser from "~/components/landing/AboutTeaser.vue";
import FeaturedWork from "~/components/landing/FeaturedWork.vue";
import ResumeTeaser from "~/components/landing/ResumeTeaser.vue";
import WritingTeaser from "~/components/landing/WritingTeaser.vue";
import ContactCta from "~/components/landing/ContactCta.vue";

useHead({
  title: "David Miller — digitalseraph.com",
  meta: [{ name: "description", content: "Engineer, builder, and occasional writer. Selected work, writing, and contact." }],
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
