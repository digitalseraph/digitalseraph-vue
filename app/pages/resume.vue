<script setup lang="ts">
import ResumeTerminal from "~/components/resume/ResumeTerminal.vue";
import ResumePrintView from "~/components/resume/ResumePrintView.vue";

useHead({ title: "Résumé — digitalseraph" });
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
