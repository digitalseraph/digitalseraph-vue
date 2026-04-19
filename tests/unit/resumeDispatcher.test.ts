import { describe, it, expect, vi } from "vitest";
import { dispatchCommand, normalizeCommand } from "~/utils/resumeDispatcher";
import type { Resume } from "~/types/resume";

const resume: Resume = {
  header: { name: "X", title: "Y", location: "Z", email: "a@b", github: "gh", linkedin: "li" },
  summary: "fake summary",
  experience: [],
  education: [],
  certifications: [],
  skills: [],
  contact: { email: "a@b", github: "gh", linkedin: "li" },
};

describe("normalizeCommand", () => {
  it("lowercases and trims", () => {
    expect(normalizeCommand("  Cat Summary.md  ")).toBe("cat summary.md");
  });
  it("collapses internal whitespace", () => {
    expect(normalizeCommand("ls   skills/")).toBe("ls skills/");
  });
});

describe("dispatchCommand", () => {
  it("dispatches whoami to a component entry", () => {
    expect(dispatchCommand("whoami", resume)).toEqual({ kind: "component", name: "WhoamiBlock" });
  });
  it("dispatches cat summary.md to a text entry with the resume summary", () => {
    expect(dispatchCommand("cat summary.md", resume)).toEqual({ kind: "text", text: "fake summary" });
  });
  it("dispatches cat experience.md to ExperienceList", () => {
    expect(dispatchCommand("cat experience.md", resume)).toEqual({ kind: "component", name: "ExperienceList" });
  });
  it("dispatches ls skills/ to SkillsGrid", () => {
    expect(dispatchCommand("ls skills/", resume)).toEqual({ kind: "component", name: "SkillsGrid" });
  });
  it("dispatches cat education.md to EducationBlock", () => {
    expect(dispatchCommand("cat education.md", resume)).toEqual({ kind: "component", name: "EducationBlock" });
  });
  it("dispatches contact to ContactBlock", () => {
    expect(dispatchCommand("contact", resume)).toEqual({ kind: "component", name: "ContactBlock" });
  });
  it("dispatches help and ? to HelpBlock", () => {
    expect(dispatchCommand("help", resume)).toEqual({ kind: "component", name: "HelpBlock" });
    expect(dispatchCommand("?", resume)).toEqual({ kind: "component", name: "HelpBlock" });
  });
  it("dispatches clear to a clear entry", () => {
    expect(dispatchCommand("clear", resume)).toEqual({ kind: "clear" });
  });
  it("dispatches pdf to null and calls window.print", () => {
    const printSpy = vi.fn();
    vi.stubGlobal("window", { print: printSpy });
    expect(dispatchCommand("pdf", resume)).toBeNull();
    expect(printSpy).toHaveBeenCalledOnce();
  });
  it("returns a text entry for unknown commands", () => {
    expect(dispatchCommand("foobar", resume)).toEqual({
      kind: "text",
      text: "command not found: foobar. try 'help'.",
    });
  });
  it("normalizes before dispatching", () => {
    expect(dispatchCommand("  CAT Summary.md ", resume)).toEqual({ kind: "text", text: "fake summary" });
  });
});
