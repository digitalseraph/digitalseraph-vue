<script setup lang="ts">
import { computed } from "vue";
import type { Component } from "vue";
import WhoamiBlock from "./outputs/WhoamiBlock.vue";
import ExperienceList from "./outputs/ExperienceList.vue";
import SkillsGrid from "./outputs/SkillsGrid.vue";
import EducationBlock from "./outputs/EducationBlock.vue";
import ContactBlock from "./outputs/ContactBlock.vue";
import HelpBlock from "./outputs/HelpBlock.vue";
import type { OutputComponentName, OutputEntry } from "~/utils/resumeDispatcher";

const props = defineProps<{
  input: string;
  output: OutputEntry;
}>();

const outputMap: Record<OutputComponentName, Component> = {
  WhoamiBlock,
  ExperienceList,
  SkillsGrid,
  EducationBlock,
  ContactBlock,
  HelpBlock,
};

const component = computed(() =>
  props.output?.kind === "component" ? outputMap[props.output.name] ?? null : null
);
</script>

<template>
  <div class="mb-4">
    <div class="flex items-baseline gap-2 mb-2">
      <span class="text-[var(--accent)] select-none">$</span>
      <span class="text-[var(--text)]">{{ input }}</span>
    </div>
    <div class="pl-[22px] text-[var(--text-muted)]">
      <template v-if="output?.kind === 'text'">
        <span class="whitespace-pre-wrap">{{ output.text }}</span>
      </template>
      <component v-else-if="component" :is="component" />
    </div>
  </div>
</template>
