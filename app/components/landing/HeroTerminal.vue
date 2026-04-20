<script setup lang="ts">
import GridBackdrop from "~/components/primitives/GridBackdrop.vue";
import TerminalPrompt from "~/components/primitives/TerminalPrompt.vue";
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform: foregroundTransform } = useParallax({ speed: 1.2, reduced });
</script>

<template>
  <section class="relative min-h-[88vh] flex items-center overflow-hidden">
    <GridBackdrop :speed="0.1" />
    <div class="max-w-[1280px] mx-auto px-8 w-full relative z-10">
      <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-4 tracking-[0.2em] uppercase">
        ~/digitalseraph.com · online
      </div>
      <TerminalPrompt command="whoami" class="mb-2" />
      <div class="pl-4 border-l-2 border-[var(--accent)]">
        <h1 class="text-[clamp(2.5rem,8vw,4.5rem)] font-display font-semibold tracking-[-0.04em] leading-[0.95] text-[var(--text)]">
          david <span class="italic text-[var(--accent)]">miller</span>
        </h1>
        <div class="mt-6 space-y-2" :style="{ transform: foregroundTransform }">
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] tracking-[0.2em] uppercase">
            Full-Stack · Cloud · DevOps
          </div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
            Senior Software Engineer III · Cox Communications · 10+ years
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase">
      ↓ scroll
    </div>
  </section>
</template>
