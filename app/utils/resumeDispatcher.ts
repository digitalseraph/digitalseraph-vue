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
  | { kind: "component"; name: OutputComponentName; props?: Record<string, unknown> }
  | { kind: "clear" }
  | { kind: "navigate"; path: string }
  | { kind: "theme"; mode: "light" | "dark" }
  | { kind: "print" }
  | null;

export interface ProjectRef {
  slug: string;
  title: string;
  year: number;
  stack: string[];
  summary: string;
}

export interface PostRef {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface DispatchContext {
  resume: Resume;
  projects: ProjectRef[];
  posts: PostRef[];
  themeMode: "light" | "dark";
  prompt: { user: string };
}

export interface ParsedCommand {
  cmd: string;
  args: string[];
  raw: string;
}

export function parseInput(raw: string): ParsedCommand {
  const trimmed = raw.trim();
  if (trimmed === "") return { cmd: "", args: [], raw: "" };
  const tokens = trimmed.split(/\s+/);
  const [first, ...rest] = tokens;
  return { cmd: (first ?? "").toLowerCase(), args: rest, raw };
}

type Handler = (parsed: ParsedCommand, ctx: DispatchContext) => OutputEntry;

const handlers: Record<string, Handler> = {
  whoami: () => ({ kind: "component", name: "WhoamiBlock" }),
  contact: () => ({ kind: "component", name: "ContactBlock" }),
  help: () => ({ kind: "component", name: "HelpBlock" }),
  "?": () => ({ kind: "component", name: "HelpBlock" }),
  clear: () => ({ kind: "clear" }),
  pdf: () => ({ kind: "print" }),
  cat: (parsed, ctx) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "summary.md") return { kind: "text", text: ctx.resume.summary };
    if (path === "experience.md") return { kind: "component", name: "ExperienceList" };
    if (path === "education.md") return { kind: "component", name: "EducationBlock" };
    return unknown(parsed);
  },
  ls: (parsed) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "skills/") return { kind: "component", name: "SkillsGrid" };
    return unknown(parsed);
  },
};

function unknown(parsed: ParsedCommand): OutputEntry {
  return { kind: "text", text: `command not found: ${parsed.cmd || parsed.raw}. try 'help'.` };
}

export function dispatchCommand(parsed: ParsedCommand, ctx: DispatchContext): OutputEntry {
  if (parsed.cmd === "") return null;
  const handler = handlers[parsed.cmd];
  if (!handler) return unknown(parsed);
  return handler(parsed, ctx);
}
