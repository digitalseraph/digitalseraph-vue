<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import CopyInline from "~/components/primitives/CopyInline.vue";
import PillLink from "~/components/primitives/PillLink.vue";
import SectionKicker from "~/components/primitives/SectionKicker.vue";
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-28 text-center">
    <SectionKicker command="contact" class="mb-6" />
    <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-8">say hello</h2>
    <div class="font-mono text-[var(--text-mono-l)] mb-8">
      <CopyInline value="hello@digitalseraph.com" />
    </div>
    <div class="flex items-center justify-center gap-3">
      <PillLink href="https://github.com/digitalseraph" external>github</PillLink>
      <PillLink href="/contact">full contact page →</PillLink>
    </div>
  </SectionReveal>
</template>
