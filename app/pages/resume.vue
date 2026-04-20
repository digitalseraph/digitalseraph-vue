<script setup lang="ts">
import ResumeTerminal from "~/components/resume/ResumeTerminal.vue";
import ResumePrintView from "~/components/resume/ResumePrintView.vue";

useSeoMeta({
  title: "Résumé — digitalseraph",
  ogTitle: "Résumé — digitalseraph",
  ogDescription: "Interactive résumé terminal. Type 'help' to see all commands.",
  ogImage: "https://digitalseraph.com/og/site.svg",
  ogType: "website",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <div>
    <ResumeTerminal class="screen-only" />
    <ResumePrintView />
  </div>
</template>

<style scoped>
.screen-only { display: block; }
@media print {
  .screen-only { display: none; }
}
</style>
