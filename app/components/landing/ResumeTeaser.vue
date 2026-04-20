<script setup lang="ts">
import { ref, computed, watch, onBeforeUnmount } from "vue";
import SectionReveal from "~/components/primitives/SectionReveal.vue";
import SectionKicker from "~/components/primitives/SectionKicker.vue";
import { useReveal } from "~/composables/useReveal";
import { useMotionStore } from "~/stores/motion";
import { storeToRefs } from "pinia";

const motion = useMotionStore();
const { reduced } = storeToRefs(motion);

interface Scene {
  command: string;
  results: string[];
}

const scenes: Scene[] = [
  {
    command: "grep Vue",
    results: [
      "experience/Cox/0    Led the Vue 3 migration",
      "projects/01-jump    Vue 3 · Vite · Pinia",
      "skills/Languages    TypeScript",
    ],
  },
  {
    command: "ls projects/",
    results: [
      "01-jump.md",
      "02-thrivee.md",
      "03-gofan.md",
      "04-trpz.md",
      "05-editorial.md",
    ],
  },
  {
    command: "uname -a",
    results: ["digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)"],
  },
];

const rootRef = ref<HTMLElement | null>(null);
const { visible } = useReveal(rootRef, { once: false });

const sceneIndex = ref(0);
const typedCommand = ref("");
const visibleResultCount = ref(0);

let timers: ReturnType<typeof setTimeout>[] = [];
let running = false;

function schedule(fn: () => void, ms: number) {
  const t = setTimeout(fn, ms);
  timers.push(t);
}

function clearAllTimers() {
  for (const t of timers) clearTimeout(t);
  timers = [];
}

async function typeCommand(text: string, speed = 35): Promise<void> {
  return new Promise((resolve) => {
    if (reduced.value) {
      typedCommand.value = text;
      resolve();
      return;
    }
    let i = 0;
    const tick = () => {
      i++;
      typedCommand.value = text.slice(0, i);
      if (i < text.length) {
        schedule(tick, speed);
      } else {
        resolve();
      }
    };
    schedule(tick, speed);
  });
}

async function runScene(scene: Scene) {
  typedCommand.value = "";
  visibleResultCount.value = 0;
  await typeCommand(scene.command);
  if (!running) return;
  // Pause after command
  await new Promise<void>((resolve) => schedule(() => resolve(), reduced.value ? 0 : 400));
  if (!running) return;
  // Fade results in
  for (let i = 0; i < scene.results.length; i++) {
    if (!running) return;
    visibleResultCount.value = i + 1;
    await new Promise<void>((resolve) => schedule(() => resolve(), reduced.value ? 0 : 150));
  }
  // Hold
  await new Promise<void>((resolve) => schedule(() => resolve(), reduced.value ? 0 : 1800));
}

async function loop() {
  running = true;
  while (running) {
    await runScene(scenes[sceneIndex.value]!);
    if (!running) return;
    sceneIndex.value = (sceneIndex.value + 1) % scenes.length;
  }
}

watch(visible, (v) => {
  if (v && !running) {
    loop();
  } else if (!v && running) {
    running = false;
    clearAllTimers();
  }
});

onBeforeUnmount(() => {
  running = false;
  clearAllTimers();
});

const currentScene = computed(() => scenes[sceneIndex.value]!);
</script>

<template>
  <SectionReveal class="max-w-[1280px] mx-auto px-8 py-20">
    <div class="flex items-baseline justify-between mb-10">
      <div>
        <SectionKicker command="./resume" />
        <h2 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em]">interactive résumé</h2>
      </div>
      <NuxtLink to="/resume" class="font-mono text-[var(--text-mono)] text-[var(--text-muted)] hover:text-[var(--accent)]">launch terminal →</NuxtLink>
    </div>

    <div ref="rootRef" class="rounded-md border border-[var(--line)] bg-[var(--canvas-raised)] p-6 font-mono text-[var(--text-mono-l)] space-y-1.5 min-h-[220px]">
      <div>
        <span class="text-[var(--text-dim)]">$</span>
        <span class="ml-2 text-[var(--text)]">{{ typedCommand }}</span>
        <span class="inline-block w-[7px] h-[14px] align-[-2px] ml-1 bg-[var(--accent)] cursor-blink" aria-hidden="true"></span>
      </div>

      <div
        v-for="(line, i) in currentScene.results"
        :key="`${sceneIndex}-${i}`"
        :class="['pl-4 text-[var(--text-muted)] transition-opacity duration-300', i < visibleResultCount ? 'opacity-100' : 'opacity-0']"
      >{{ line }}</div>
    </div>

    <p class="mt-6 text-[var(--text-muted)] max-w-xl">
      A real shell, not a résumé page. Command history, tab completion, file system layout, grep across my whole career. <NuxtLink to="/resume" class="text-[var(--accent)] hover:underline underline-offset-4">open it →</NuxtLink>
    </p>
  </SectionReveal>
</template>

<style scoped>
@keyframes cursor-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
.cursor-blink { animation: cursor-blink 1.1s infinite; }
@media (prefers-reduced-motion: reduce) {
  .cursor-blink { animation: none; opacity: 1; }
}
</style>
