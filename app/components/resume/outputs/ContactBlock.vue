<script setup lang="ts">
import CopyInline from "~/components/primitives/CopyInline.vue";
const resume = useResume();
const contact = computed(() => resume.value?.contact);
</script>

<template>
  <div v-if="contact" class="space-y-1">
    <div><span class="text-[var(--text-dim)]">email:</span> <CopyInline :value="contact.email" /></div>
    <div>
      <span class="text-[var(--text-dim)]">github:</span>
      <a :href="`https://github.com/${contact.github}`" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline">github.com/{{ contact.github }}</a>
    </div>
    <div>
      <span class="text-[var(--text-dim)]">linkedin:</span>
      <a :href="`https://linkedin.com/in/${contact.linkedin}`" target="_blank" rel="noopener noreferrer" class="text-[var(--accent)] hover:underline">linkedin.com/in/{{ contact.linkedin }}</a>
    </div>
  </div>
</template>
