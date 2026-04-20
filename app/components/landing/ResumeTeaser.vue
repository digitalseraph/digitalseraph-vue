<script setup lang="ts">
import SectionReveal from "~/components/primitives/SectionReveal.vue";
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-32">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <div class="font-mono text-[var(--text-mono)] text-[var(--accent)] mb-2 tracking-[0.2em] uppercase">$ ./resume</div>
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">interactive résumé</h2>
      </div>
      <NuxtLink to="/resume" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">launch terminal →</NuxtLink>
    </div>

    <div class="rounded-md border border-[var(--line)] bg-[var(--canvas-raised)] p-6 font-mono text-[var(--text-mono-l)] space-y-1.5">
      <div><span class="text-[var(--text-dim)]">$</span> <span class="text-[var(--text)]">help</span></div>
      <div class="pl-4 text-[var(--text-muted)]">
        <span class="text-[var(--accent)]">whoami</span> · <span class="text-[var(--accent)]">cat experience.md</span> · <span class="text-[var(--accent)]">ls projects/</span> · <span class="text-[var(--accent)]">grep &lt;term&gt;</span> · <span class="text-[var(--accent)]">theme light</span>
      </div>
      <div class="pt-2">
        <span class="text-[var(--text-dim)]">$</span> <span class="text-[var(--text)]">_</span>
      </div>
    </div>

    <p class="mt-6 text-[var(--text-muted)] max-w-xl">
      A real shell, not a résumé page. Command history, tab completion, file system layout, grep across my whole career. <NuxtLink to="/resume" class="text-[var(--accent)] hover:underline underline-offset-4">open it →</NuxtLink>
    </p>
  </SectionReveal>
</template>
