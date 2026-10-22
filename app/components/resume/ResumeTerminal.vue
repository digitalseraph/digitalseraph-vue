<script setup lang="ts">
import { ref, watch, computed, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useRouter } from "vue-router";
import { useMotionStore } from "~/stores/motion";
import { useThemeStore } from "~/stores/theme";
import { useRandomUsername } from "~/composables/useRandomUsername";
import {
  parseInput,
  dispatchCommand,
  type OutputEntry,
  type DispatchContext,
  type ProjectRef,
  type ResumePostRef,
} from "~/utils/resumeDispatcher";
import ResumeBuffer from "./ResumeBuffer.vue";
import ResumeEntry from "./ResumeEntry.vue";
import ResumePrompt from "./ResumePrompt.vue";
import ResumeSidebar from "./ResumeSidebar.vue";

const resume = useResume();
const motion = useMotionStore();
const { reduced } = storeToRefs(motion);
const themeStore = useThemeStore();
const router = useRouter();

// Non-awaited useAsyncData: data starts null, populates reactively.
// Avoids top-level await so the terminal doesn't block the tree's Suspense.
const { data: projectsData } = useAsyncData("terminal-projects", () =>
  queryCollection("work").order("year", "DESC").all(),
);
const { data: postsData } = useAsyncData("terminal-posts", () =>
  queryCollection("writing").where("draft", "=", false).order("date", "DESC").all(),
);

const projects = computed<ProjectRef[]>(() =>
  (projectsData.value ?? []).map((p) => ({
    slug: p.stem.replace(/^work\//, ""),
    title: p.title,
    year: p.year,
    stack: p.stack,
    summary: p.summary,
  })),
);

const posts = computed<ResumePostRef[]>(() =>
  (postsData.value ?? []).map((p) => ({
    slug: p.stem.replace(/^writing\//, ""),
    title: p.title,
    date: p.date,
    excerpt: p.excerpt,
  })),
);

const username = ref("user");

interface BufferEntry {
  id: string;
  input: string;
  output: OutputEntry;
}

const buffer = ref<BufferEntry[]>([]);
const history = ref<string[]>([]);
const input = ref("");
const promptRef = ref<InstanceType<typeof ResumePrompt> | null>(null);

let entryCounter = 0;
function nextId() {
  entryCounter += 1;
  return `entry-${entryCounter}`;
}

function buildContext(): DispatchContext | null {
  if (!resume.value) return null;
  return {
    resume: resume.value,
    projects: projects.value,
    posts: posts.value,
    themeMode: themeStore.mode,
    prompt: { user: username.value },
  };
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

function appendEntry(inputText: string, output: Exclude<OutputEntry, null>) {
  buffer.value = [...buffer.value, { id: nextId(), input: inputText, output }];
}

async function runCommand(cmd: string) {
  const ctx = buildContext();
  if (!ctx) return;

  const parsed = parseInput(cmd.trim());
  if (parsed.cmd === "") {
    input.value = "";
    return;
  }

  history.value = [...history.value, parsed.raw];

  const output = dispatchCommand(parsed, ctx);
  if (output === null) return; // Narrows type; empty-cmd is already returned above.

  if (output.kind === "clear") {
    buffer.value = [];
  } else if (output.kind === "navigate") {
    router.push(output.path);
  } else if (output.kind === "theme") {
    themeStore.setMode(output.mode);
    appendEntry(parsed.raw, { kind: "text", text: `theme: ${output.mode}` });
  } else if (output.kind === "print") {
    if (typeof window !== "undefined") window.print();
  } else {
    appendEntry(parsed.raw, output);
  }

  input.value = "";
  await nextTick();
  promptRef.value?.focus();
}

function onSidebarRun(cmd: string) {
  typeInto(cmd).then(() => runCommand(cmd));
}

function onCandidates(candidates: string[]) {
  appendEntry("", { kind: "text", text: candidates.join("  ") });
}

async function runIntro() {
  const introCmd = "whoami";
  await typeInto(introCmd);
  await new Promise((r) => setTimeout(r, reduced.value ? 0 : 150));
  await runCommand(introCmd);

  if (typeof window !== "undefined") {
    const key = "ds-terminal-tip-seen";
    if (!window.sessionStorage.getItem(key)) {
      await new Promise((r) => setTimeout(r, reduced.value ? 0 : 400));
      appendEntry("", {
        kind: "text",
        text: "[tip: type 'help' for all commands, or try 'grep Vue' · ↑/↓ for history · Tab to complete]",
      });
      window.sessionStorage.setItem(key, "1");
    }
  }
}

const introRan = ref(false);

onMounted(() => {
  username.value = useRandomUsername() || "user";
});

watch(
  resume,
  (r) => {
    if (r && !introRan.value) {
      introRan.value = true;
      runIntro();
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="grid grid-cols-[240px_1fr] max-lg:grid-cols-1 gap-4 h-[calc(100vh-48px)] max-w-[1280px] mx-auto px-4 md:px-8">
    <ResumeSidebar class="max-lg:order-first" @run="onSidebarRun" />
    <div class="flex flex-col min-h-0 pt-6 pb-2">
      <ResumeBuffer :entry-count="buffer.length" @focus-input="() => promptRef?.focus()">
        <ResumeEntry v-for="entry in buffer" :key="entry.id" :input="entry.input" :output="entry.output" />
      </ResumeBuffer>
      <ResumePrompt
        ref="promptRef"
        v-model="input"
        :history="history"
        :username="username"
        :commands="['whoami','cat summary.md','cat experience.md','cat education.md','ls','ls skills/','ls projects/','ls writing/','contact','help','clear','pdf','date','uname','echo','sudo','exit','logout','theme','grep']"
        :project-slugs="projects.map((p) => p.slug)"
        :post-slugs="posts.map((p) => p.slug)"
        @submit="runCommand"
        @candidates="onCandidates"
      />
    </div>
  </div>
</template>
