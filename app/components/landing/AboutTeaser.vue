<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-20">
    <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-6 tracking-[0.2em] uppercase">$ cat about.md</div>
    <p class="text-[var(--text-body-l)] text-[var(--text)] max-w-2xl leading-relaxed">
      I'm a Senior Full-Stack Engineer with 10+ years shipping production software across healthcare, fintech, e-commerce, and media. Currently at Cox Communications — Vue 3 platform, AWS DevOps, full test harnesses.
    </p>
    <div class="mt-8">
      <NuxtLink to="/about" class="font-mono text-[var(--text-mono-l)] text-[var(--accent)] hover:underline underline-offset-4">
        read more →
      </NuxtLink>
    </div>
  </SectionReveal>
</template>
