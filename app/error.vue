<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { didYouMean, type Candidate } from "~/utils/didYouMean";

defineProps<{ error: { statusCode: number; message?: string; url?: string } }>();

const route = useRoute();
const path = route.fullPath;

const { data: projectsData } = useAsyncData("error-projects", () =>
  queryCollection("work").order("year", "DESC").all()
);
const { data: postsData } = useAsyncData("error-posts", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all()
);

const candidates = computed<Candidate[]>(() => {
  const base: Candidate[] = [
    { path: "/", label: "home" },
    { path: "/about", label: "about" },
    { path: "/work", label: "work" },
    { path: "/resume", label: "resume" },
    { path: "/writing", label: "writing" },
    { path: "/contact", label: "contact" },
  ];
  const projects = (projectsData.value ?? []).map((p) => ({
    path: `/work/${p.stem.replace(/^work\//, "")}`,
    label: p.title,
  }));
  const posts = (postsData.value ?? []).map((p) => ({
    path: `/writing/${p.stem.replace(/^writing\//, "")}`,
    label: p.title,
  }));
  return [...base, ...projects, ...posts];
});

const suggestion = computed(() => didYouMean(path, candidates.value));

function home() {
  clearError({ redirect: "/" });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-8 py-24 bg-[var(--canvas)]">
    <div class="max-w-2xl w-full">
      <div class="font-mono text-[var(--text-mono)] text-[var(--text-dim)] mb-4 tracking-[0.2em] uppercase">
        ~/digitalseraph.com · error
      </div>

      <div class="font-mono text-[var(--text-mono-l)] space-y-2 mb-8">
        <div>
          <span class="text-[var(--accent)]">$</span>
          <span class="ml-2 text-[var(--text)]">cat {{ path }}</span>
        </div>
        <div v-if="error.statusCode === 404" class="text-[var(--text-muted)]">
          bash: {{ path }}: No such file or directory
        </div>
        <div v-else class="text-[var(--text-muted)]">
          bash: {{ error.statusCode }}: {{ error.message || 'internal error' }}
        </div>
      </div>

      <div v-if="suggestion && error.statusCode === 404" class="font-mono text-[var(--text-mono-l)] mb-8">
        <div class="text-[var(--text-dim)]">did you mean:</div>
        <NuxtLink
          :to="suggestion.path"
          class="block mt-1 text-[var(--accent)] hover:underline underline-offset-4"
          @click="home"
        >→ {{ suggestion.path }}<span v-if="suggestion.label && suggestion.label !== suggestion.path" class="ml-2 text-[var(--text-dim)]">{{ suggestion.label }}</span></NuxtLink>
      </div>

      <h1 class="text-[var(--text-display-l)] font-display font-semibold tracking-[-0.03em] mb-6 text-[var(--text)]">
        <span v-if="error.statusCode === 404">page not found</span>
        <span v-else>something broke</span>
      </h1>

      <p class="text-[var(--text-muted)] mb-10">
        <span v-if="error.statusCode === 404">
          The path you followed doesn't exist. It may have moved, been renamed, or never existed.
        </span>
        <span v-else>
          An unexpected error occurred. Try reloading, or head back home.
        </span>
      </p>

      <div class="flex flex-wrap gap-6 font-mono text-[var(--text-mono)]">
        <button
          type="button"
          class="text-[var(--accent)] hover:underline underline-offset-4"
          @click="home"
        >→ cd ~</button>
        <NuxtLink to="/resume" class="text-[var(--accent)] hover:underline underline-offset-4" @click="home">→ launch résumé terminal</NuxtLink>
        <NuxtLink to="/work" class="text-[var(--accent)] hover:underline underline-offset-4" @click="home">→ selected work</NuxtLink>
      </div>
    </div>
  </div>
</template>
