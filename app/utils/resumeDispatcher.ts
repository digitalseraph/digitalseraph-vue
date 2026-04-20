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
  | "PostPreview"
  | "GrepResults";

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
  excerpt: string | null;
}

export interface GrepMatch {
  source: string;
  snippet: string;
  link?: string;
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

    const writingMatch = /^writing\/(.+)\.md$/.exec(path);
    if (writingMatch) {
      const slug = writingMatch[1]!;
      const found = ctx.posts.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "component", name: "PostPreview", props: { slug: found.slug } };
      return { kind: "text", text: `cat: writing/${slug}.md: No such file or directory` };
    }

    if (path.startsWith("writing/")) {
      return { kind: "text", text: `cat: ${rawPath}: No such file or directory` };
    }

    return unknown(parsed);
  },
  grep: (parsed, ctx) => {
    const term = parsed.args.join(" ");
    if (term === "") {
      return { kind: "text", text: "grep: missing search term. usage: grep <term>" };
    }
    const needle = term.toLowerCase();
    const matches: GrepMatch[] = [];

    for (const role of ctx.resume.experience) {
      (role.bullets ?? []).forEach((bullet, i) => {
        if (bullet != null && bullet.toLowerCase().includes(needle)) {
          matches.push({ source: `experience/${role.company}/${i}`, snippet: bullet });
        }
      });
    }

    for (const group of ctx.resume.skills) {
      for (const item of (group.items ?? [])) {
        if (item != null && item.toLowerCase().includes(needle)) {
          matches.push({ source: `skills/${group.group}/${item}`, snippet: item });
        }
      }
    }

    for (const p of ctx.projects) {
      const stackHit = (p.stack ?? []).some((s) => s != null && s.toLowerCase().includes(needle));
      const titleHit = p.title != null && p.title.toLowerCase().includes(needle);
      const summaryHit = p.summary != null && p.summary.toLowerCase().includes(needle);
      if (titleHit || summaryHit || stackHit) {
        matches.push({
          source: `projects/${p.slug}`,
          snippet: `${p.title ?? ""} — ${p.summary ?? ""}`,
          link: `/work/${p.slug}`,
        });
      }
    }

    for (const p of ctx.posts) {
      const titleHit = p.title != null && p.title.toLowerCase().includes(needle);
      const excerptHit = p.excerpt != null && p.excerpt.toLowerCase().includes(needle);
      if (titleHit || excerptHit) {
        matches.push({
          source: `writing/${p.slug}`,
          snippet: `${p.title ?? ""} — ${p.excerpt ?? ""}`,
          link: `/writing/${p.slug}`,
        });
      }
    }

    return { kind: "component", name: "GrepResults", props: { term, matches } };
  },
  open: (parsed, ctx) => {
    const rawArg = parsed.args[0];
    if (!rawArg) {
      return { kind: "text", text: "open: missing path. usage: open <path>" };
    }
    if (rawArg.startsWith("/")) {
      return { kind: "navigate", path: rawArg };
    }

    const path = rawArg.toLowerCase();
    const projectsMatch = /^projects\/(.+?)(\.md)?$/.exec(path);
    if (projectsMatch) {
      const slug = projectsMatch[1]!;
      const found = ctx.projects.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "navigate", path: `/work/${found.slug}` };
      return { kind: "text", text: `open: ${rawArg.replace(/\.md$/, "")}: No such file or directory` };
    }

    const writingMatch = /^writing\/(.+?)(\.md)?$/.exec(path);
    if (writingMatch) {
      const slug = writingMatch[1]!;
      const found = ctx.posts.find((p) => p.slug.toLowerCase() === slug);
      if (found) return { kind: "navigate", path: `/writing/${found.slug}` };
      return { kind: "text", text: `open: ${rawArg.replace(/\.md$/, "")}: No such file or directory` };
    }

    return { kind: "text", text: `open: ${rawArg}: No such file or directory` };
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
