import type { Resume } from "~/types/resume";

export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock";

export type OutputEntry =
  | { kind: "text"; text: string }
  | { kind: "component"; name: OutputComponentName }
  | { kind: "clear" }
  | null;

export function normalizeCommand(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function dispatchCommand(input: string, resume: Resume): OutputEntry {
  const cmd = normalizeCommand(input);

  switch (cmd) {
    case "whoami":
      return { kind: "component", name: "WhoamiBlock" };
    case "cat summary.md":
      return { kind: "text", text: resume.summary };
    case "cat experience.md":
      return { kind: "component", name: "ExperienceList" };
    case "ls skills/":
      return { kind: "component", name: "SkillsGrid" };
    case "cat education.md":
      return { kind: "component", name: "EducationBlock" };
    case "contact":
      return { kind: "component", name: "ContactBlock" };
    case "help":
    case "?":
      return { kind: "component", name: "HelpBlock" };
    case "clear":
      return { kind: "clear" };
    case "pdf":
      if (typeof window !== "undefined") window.print();
      return null;
    default:
      return { kind: "text", text: `command not found: ${cmd}. try 'help'.` };
  }
}
