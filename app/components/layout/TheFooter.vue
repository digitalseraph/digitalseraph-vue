<script setup lang="ts">
const year = new Date().getFullYear();
</script>

<template>
  <footer class="border-t border-[var(--line)] mt-32 py-10 text-center font-mono text-[var(--text-mono)] text-[var(--text-dim)]">
    <div>— © {{ year }} david miller —</div>
    <div class="mt-2">
      <a href="https://github.com/digitalseraph" target="_blank" rel="noopener noreferrer" class="hover:text-[var(--accent)] transition-colors">github</a>
      <span class="mx-2">·</span>
      <NuxtLink to="/contact" class="hover:text-[var(--accent)] transition-colors">contact</NuxtLink>
    </div>
  </footer>
</template>
