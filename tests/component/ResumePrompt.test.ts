// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ResumePrompt from "~/components/resume/ResumePrompt.vue";

describe("ResumePrompt — history navigation", () => {
  it("ArrowUp recalls the most recent history entry", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        username: "user00001",
        history: ["whoami", "help", "contact"],
        commands: [],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("contact");
  });

  it("ArrowUp twice walks further back into history", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        history: ["whoami", "help", "contact"],
        commands: [], projectSlugs: [], postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("help");
  });

  it("ArrowDown past newest clears the input", async () => {
    let current = "";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "",
        history: ["whoami"],
        commands: [], projectSlugs: [], postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "ArrowUp" });
    expect(current).toBe("whoami");
    await input.trigger("keydown", { key: "ArrowDown" });
    expect(current).toBe("");
  });
});

describe("ResumePrompt — Tab completion", () => {
  it("Tab with a single matching command completes the input", async () => {
    let current = "who";
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "who",
        history: [],
        commands: ["whoami", "help"],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Tab" });
    expect(current).toBe("whoami");
  });

  it("Tab with multiple matches emits candidates and leaves input alone", async () => {
    let current = "c";
    const candidates: string[][] = [];
    const wrapper = await mountSuspended(ResumePrompt, {
      props: {
        modelValue: "c",
        history: [],
        commands: ["cat summary.md", "contact", "clear"],
        projectSlugs: [],
        postSlugs: [],
        "onUpdate:modelValue": (v: string) => { current = v; },
        "onCandidates": (v: string[]) => { candidates.push(v); },
      },
    });
    const input = wrapper.find("input");
    await input.trigger("keydown", { key: "Tab" });
    expect(current).toBe("c");
    expect(candidates.length).toBe(1);
    expect(candidates[0]).toEqual(expect.arrayContaining(["cat summary.md", "contact", "clear"]));
  });
});
