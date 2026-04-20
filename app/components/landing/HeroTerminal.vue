<script setup lang="ts">
import { ref, watch } from "vue";
import GridBackdrop from "~/components/primitives/GridBackdrop.vue";
import TerminalPrompt from "~/components/primitives/TerminalPrompt.vue";
import { useParallax } from "~/composables/useParallax";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const { transform: foregroundTransform } = useParallax({ speed: 1.2, reduced });

const promptRef = ref<InstanceType<typeof TerminalPrompt> | null>(null);
const nameVisible = ref(false);

// Letter arrays for staggered reveal
const davidLetters = ["d", "a", "v", "i", "d"];
const millerLetters = ["m", "i", "l", "l", "e", "r"];

// When whoami finishes typing, wait then trigger the name reveal.
watch(
  () => promptRef.value?.done,
  (done) => {
    if (!done) return;
    if (reduced.value) {
      nameVisible.value = true;
      return;
    }
    setTimeout(() => { nameVisible.value = true; }, 150);
  }
);
</script>

<template>
  <section class="relative min-h-[88vh] flex items-center overflow-hidden">
    <GridBackdrop :speed="0.1" />
    <div class="max-w-[1280px] mx-auto px-8 w-full relative z-10">
      <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-4 tracking-[0.2em] uppercase">
        ~/digitalseraph.com · online
      </div>
      <TerminalPrompt ref="promptRef" command="whoami" class="mb-2" />
      <div class="pl-4 border-l-2 border-[var(--accent)]">
        <h1
          :class="['hero-title text-[clamp(2.5rem,8vw,4.5rem)] font-display font-semibold tracking-[-0.04em] leading-[0.95] text-[var(--text)]', { 'is-revealed': nameVisible }]"
          aria-label="david miller"
        >
          <span aria-hidden="true" class="hero-word">
            <span
              v-for="(ch, i) in davidLetters"
              :key="`d-${i}`"
              class="hero-letter"
              :style="{ '--i': i }"
            >{{ ch }}</span>
          </span>
          <span aria-hidden="true" class="hero-word hero-word--accent italic text-[var(--accent)]">
            <span
              v-for="(ch, i) in millerLetters"
              :key="`m-${i}`"
              class="hero-letter"
              :style="{ '--i': i + 5 }"
            >{{ ch }}</span>
          </span>
        </h1>
        <div class="mt-6 space-y-2" :style="{ transform: foregroundTransform }">
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] tracking-[0.2em] uppercase">
            Full-Stack · Cloud · DevOps
          </div>
          <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
            Senior Software Engineer III · <NuxtLink to="/work/01-jump" class="hover:text-[var(--accent)] hover:underline underline-offset-4 transition-colors">Cox Communications</NuxtLink> · 10+ years
          </div>
        </div>
      </div>
    </div>
    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[var(--text-mono)] text-[var(--text-dim)] tracking-[0.2em] uppercase">
      ↓ scroll
    </div>
  </section>
</template>

<style scoped>
.hero-word {
  display: inline-block;
  white-space: nowrap;
}
.hero-word + .hero-word {
  margin-left: 0.25em;
}
.hero-letter {
  display: inline-block;
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 400ms cubic-bezier(0.2, 0.6, 0.2, 1),
    transform 400ms cubic-bezier(0.2, 0.6, 0.2, 1);
  transition-delay: calc(var(--i) * 60ms + 150ms);
}
.hero-title.is-revealed .hero-letter {
  opacity: 1;
  transform: translateY(0);
}
/* The accent word (miller) starts its stagger 200ms after david's last letter.
   david has 5 letters × 60ms = 300ms; miller's first letter is index 5, so
   its base delay is 5 * 60ms = 300ms, giving a natural continuation. Add a
   +200ms delay on the accent word to create the "lead in" pause. */
.hero-word--accent .hero-letter {
  transition-delay: calc(var(--i) * 60ms + 150ms + 200ms);
}

@media (prefers-reduced-motion: reduce) {
  .hero-letter {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
