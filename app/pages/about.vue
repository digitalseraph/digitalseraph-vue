<script setup lang="ts">
const { data: about } = await useAsyncData("about", () =>
  queryCollection("about").first()
);
useHead({ title: `About — digitalseraph` });
</script>

<template>
  <article class="max-w-2xl mx-auto px-8 py-24">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ cat about.md</div>
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">about</h1>
    <div class="prose prose-invert max-w-none">
      <ContentRenderer v-if="about" :value="about" />
    </div>
  </article>
</template>
