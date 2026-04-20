<script setup lang="ts">
import { useRoute } from "vue-router";

defineProps<{ error: { statusCode: number; message?: string; url?: string } }>();

const route = useRoute();
const path = route.fullPath;

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

      <div class="font-mono text-[var(--text-mono-l)] space-y-2 mb-12">
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
