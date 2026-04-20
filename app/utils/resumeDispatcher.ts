import type { Resume } from "~/types/resume";

export type OutputComponentName =
  | "WhoamiBlock"
  | "ExperienceList"
  | "SkillsGrid"
  | "EducationBlock"
  | "ContactBlock"
  | "HelpBlock"
  | "DirectoryListing"
  | "ProjectPreview"
  | "PostPreview";

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
  date: () => ({
    kind: "text",
    text: new Date().toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    }),
  }),
  uname: (parsed) => {
    if (parsed.args[0] === "-a") {
      return { kind: "text", text: "digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)" };
    }
    return { kind: "text", text: "digitalseraph" };
  },
  echo: (parsed) => ({ kind: "text", text: parsed.args.join(" ") }),
  sudo: (_parsed, ctx) => ({
    kind: "text",
    text: `${ctx.prompt.user} is not in the sudoers file.  This incident will be reported.`,
  }),
  exit: () => ({ kind: "navigate", path: "/" }),
  logout: () => ({ kind: "navigate", path: "/" }),
  theme: (parsed, ctx) => {
    const arg = (parsed.args[0] ?? "").toLowerCase();
    if (arg === "") return { kind: "text", text: `current theme: ${ctx.themeMode}` };
    if (arg === "light" || arg === "dark") return { kind: "theme", mode: arg };
    return { kind: "text", text: `theme: invalid mode '${arg}'. valid modes: light, dark` };
  },
  cat: (parsed, ctx) => {
    const rawPath = parsed.args[0] ?? "";
    const path = rawPath.toLowerCase();
    if (path === "summary.md") return { kind: "text", text: ctx.resume.summary };
    if (path === "experience.md") return { kind: "component", name: "ExperienceList" };
    if (path === "education.md") return { kind: "component", name: "EducationBlock" };

    const projectsMatch = /^projects\/(.+)\.md$/.exec(path);
    if (projectsMatch) {
      const slug = projectsMatch[1]!;
      const found = ctx.projects.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "component", name: "ProjectPreview", props: { slug: found.slug } };
      return { kind: "text", text: `cat: projects/${slug}.md: No such file or directory` };
    }

    if (path.startsWith("projects/")) {
      return { kind: "text", text: `cat: ${rawPath}: No such file or directory` };
    }

    return unknown(parsed);
  },
  ls: (parsed, ctx) => {
    const path = (parsed.args[0] ?? "").toLowerCase();
    if (path === "") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: [
            { name: "summary.md", kind: "file" },
            { name: "experience.md", kind: "file" },
            { name: "education.md", kind: "file" },
            { name: "contact", kind: "file" },
            { name: "skills/", kind: "dir" },
            { name: "projects/", kind: "dir" },
            { name: "writing/", kind: "dir" },
          ],
        },
      };
    }
    if (path === "skills/") return { kind: "component", name: "SkillsGrid" };
    if (path === "projects/") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: ctx.projects.map((p) => ({
            name: `${p.slug}.md`,
            kind: "file",
            link: `/work/${p.slug}`,
          })),
        },
      };
    }
    if (path === "writing/") {
      return {
        kind: "component",
        name: "DirectoryListing",
        props: {
          items: ctx.posts.map((p) => ({
            name: `${p.slug}.md`,
            kind: "file",
            link: `/writing/${p.slug}`,
          })),
        },
      };
    }
    return unknown(parsed);
  },
};

function unknown(parsed: ParsedCommand): OutputEntry {
  const name = parsed.cmd || parsed.raw.trim();
  return { kind: "text", text: `bash: ${name}: command not found` };
}

export function dispatchCommand(parsed: ParsedCommand, ctx: DispatchContext): OutputEntry {
  if (parsed.cmd === "") return null;
  const handler = handlers[parsed.cmd];
  if (!handler) return unknown(parsed);
  return handler(parsed, ctx);
}
