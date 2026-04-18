<script setup lang="ts">
import CopyInline from "~/components/primitives/CopyInline.vue";
import PillLink from "~/components/primitives/PillLink.vue";
useHead({ title: "Contact — digitalseraph" });
</script>

<template>
  <section class="max-w-xl mx-auto px-8 py-24">
    <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">contact</h1>
    <p class="text-[var(--text-muted)] mb-8">The simplest way is email. If you prefer something else, pick a link below.</p>
    <div class="font-mono text-[var(--text-mono-l)] mb-10">
      <CopyInline value="hello@digitalseraph.com" />
    </div>
    <div class="flex flex-wrap gap-3">
      <PillLink href="https://github.com/digitalseraph" external>github</PillLink>
      <PillLink href="https://linkedin.com/in/davidmiller" external>linkedin</PillLink>
    </div>
  </section>
</template>
