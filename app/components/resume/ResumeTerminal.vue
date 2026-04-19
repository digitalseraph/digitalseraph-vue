<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useMotionStore } from "~/stores/motion";
import { dispatchCommand, type OutputEntry } from "~/utils/resumeDispatcher";
import ResumeBuffer from "./ResumeBuffer.vue";
import ResumeEntry from "./ResumeEntry.vue";
import ResumePrompt from "./ResumePrompt.vue";
import ResumeSidebar from "./ResumeSidebar.vue";

const resume = useResume();
const motion = useMotionStore();
const { reduced } = storeToRefs(motion);

interface BufferEntry {
  id: string;
  input: string;
  output: OutputEntry;
}

const buffer = ref<BufferEntry[]>([]);
const input = ref("");
const isStreaming = ref(false);
const promptRef = ref<InstanceType<typeof ResumePrompt> | null>(null);

let entryCounter = 0;
function nextId() {
  entryCounter += 1;
  return `entry-${entryCounter}`;
}

async function typeInto(text: string, speed = 45) {
  if (reduced.value) {
    input.value = text;
    return;
  }
  input.value = "";
  for (let i = 0; i < text.length; i++) {
    input.value += text[i];
    await new Promise((r) => setTimeout(r, speed));
  }
}

async function runCommand(cmd: string) {
  if (!resume.value) return;
  if (isStreaming.value) {
    isStreaming.value = false;
  }

  const raw = cmd.trim();
  if (!raw) return;

  const output = dispatchCommand(raw, resume.value);

  if (output?.kind === "clear") {
    buffer.value = [];
  } else if (output !== null) {
    buffer.value = [...buffer.value, { id: nextId(), input: raw, output }];
  }

  input.value = "";
  await nextTick();
  promptRef.value?.focus();
}

function onSidebarRun(cmd: string) {
  typeInto(cmd).then(() => runCommand(cmd));
}

async function runIntro() {
  const introCmd = "whoami";
  await typeInto(introCmd);
  await new Promise((r) => setTimeout(r, reduced.value ? 0 : 150));
  await runCommand(introCmd);
}

onMounted(() => {
  runIntro();
});
</script>

<template>
  <div class="grid grid-cols-[240px_1fr] max-lg:grid-cols-1 gap-4 h-[calc(100vh-48px)] max-w-[1280px] mx-auto px-4 md:px-8">
    <ResumeSidebar class="max-lg:order-first" @run="onSidebarRun" />
    <div class="flex flex-col min-h-0 pt-6 pb-2">
      <ResumeBuffer :entry-count="buffer.length" @focus-input="() => promptRef?.focus()">
        <ResumeEntry v-for="entry in buffer" :key="entry.id" :input="entry.input" :output="entry.output" />
      </ResumeBuffer>
      <ResumePrompt ref="promptRef" v-model="input" @submit="runCommand" />
    </div>
  </div>
</template>
