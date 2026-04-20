import { describe, it, expect } from "vitest";
import { parseInput, dispatchCommand, type DispatchContext } from "~/utils/resumeDispatcher";
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

const ctx: DispatchContext = {
  resume,
  projects: [],
  posts: [],
  themeMode: "dark",
  prompt: { user: "user12345" },
};

describe("parseInput", () => {
  it("returns an empty-cmd ParsedCommand for blank input", () => {
    expect(parseInput("")).toEqual({ cmd: "", args: [], raw: "" });
    expect(parseInput("   ")).toEqual({ cmd: "", args: [], raw: "" });
  });

  it("lowercases the cmd and preserves args case", () => {
    expect(parseInput("Echo Hello World")).toEqual({
      cmd: "echo", args: ["Hello", "World"], raw: "Echo Hello World",
    });
  });

  it("collapses internal whitespace in args", () => {
    expect(parseInput("echo a   b  c")).toEqual({
      cmd: "echo", args: ["a", "b", "c"], raw: "echo a   b  c",
    });
  });

  it("keeps multi-token commands that are actually cmd + args", () => {
    expect(parseInput("cat summary.md")).toEqual({
      cmd: "cat", args: ["summary.md"], raw: "cat summary.md",
    });
  });

  it("preserves the raw input verbatim (no trim) except for empty detection", () => {
    expect(parseInput("cat summary.md").raw).toBe("cat summary.md");
  });
});

describe("dispatchCommand — existing commands", () => {
  it("empty cmd → null", () => {
    expect(dispatchCommand(parseInput(""), ctx)).toBeNull();
  });

  it("whoami → WhoamiBlock", () => {
    expect(dispatchCommand(parseInput("whoami"), ctx)).toEqual({ kind: "component", name: "WhoamiBlock" });
  });

  it("cat summary.md → text with resume summary", () => {
    expect(dispatchCommand(parseInput("cat summary.md"), ctx)).toEqual({ kind: "text", text: "fake summary" });
  });

  it("cat experience.md → ExperienceList", () => {
    expect(dispatchCommand(parseInput("cat experience.md"), ctx)).toEqual({ kind: "component", name: "ExperienceList" });
  });

  it("ls skills/ → SkillsGrid", () => {
    expect(dispatchCommand(parseInput("ls skills/"), ctx)).toEqual({ kind: "component", name: "SkillsGrid" });
  });

  it("cat education.md → EducationBlock", () => {
    expect(dispatchCommand(parseInput("cat education.md"), ctx)).toEqual({ kind: "component", name: "EducationBlock" });
  });

  it("contact → ContactBlock", () => {
    expect(dispatchCommand(parseInput("contact"), ctx)).toEqual({ kind: "component", name: "ContactBlock" });
  });

  it("help and ? → HelpBlock", () => {
    expect(dispatchCommand(parseInput("help"), ctx)).toEqual({ kind: "component", name: "HelpBlock" });
    expect(dispatchCommand(parseInput("?"), ctx)).toEqual({ kind: "component", name: "HelpBlock" });
  });

  it("clear → clear kind", () => {
    expect(dispatchCommand(parseInput("clear"), ctx)).toEqual({ kind: "clear" });
  });

  it("pdf → print kind (no direct window.print call)", () => {
    expect(dispatchCommand(parseInput("pdf"), ctx)).toEqual({ kind: "print" });
  });

  it("unknown → bash-style 'command not found'", () => {
    expect(dispatchCommand(parseInput("foobar"), ctx)).toEqual({
      kind: "text",
      text: "bash: foobar: command not found",
    });
  });

  it("accepts input in any case (cmd is normalized)", () => {
    expect(dispatchCommand(parseInput("CAT Summary.md"), ctx)).toEqual({ kind: "text", text: "fake summary" });
  });
});

describe("dispatchCommand — flavor commands", () => {
  it("date returns a text entry formatted en-US", () => {
    const r = dispatchCommand(parseInput("date"), ctx);
    expect(r?.kind).toBe("text");
    if (r?.kind === "text") {
      expect(r.text).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
    }
  });

  it("uname returns 'digitalseraph'", () => {
    expect(dispatchCommand(parseInput("uname"), ctx)).toEqual({ kind: "text", text: "digitalseraph" });
  });

  it("uname -a returns the full build string", () => {
    expect(dispatchCommand(parseInput("uname -a"), ctx)).toEqual({
      kind: "text",
      text: "digitalseraph 1.0 (Vue 3, Nuxt 4, Cloudflare Workers)",
    });
  });
});

describe("dispatchCommand — echo", () => {
  it("echo joins args with a single space", () => {
    expect(dispatchCommand(parseInput("echo hello world"), ctx)).toEqual({
      kind: "text", text: "hello world",
    });
  });

  it("echo preserves the case of args", () => {
    expect(dispatchCommand(parseInput("echo Hello World"), ctx)).toEqual({
      kind: "text", text: "Hello World",
    });
  });

  it("echo with no args returns an empty text entry", () => {
    expect(dispatchCommand(parseInput("echo"), ctx)).toEqual({
      kind: "text", text: "",
    });
  });

  it("echo output kind is 'text' even when args contain HTML (XSS guard)", () => {
    const r = dispatchCommand(parseInput("echo <script>alert(1)</script>"), ctx);
    expect(r?.kind).toBe("text");
    if (r?.kind === "text") {
      expect(r.text).toContain("<script>");
    }
  });
});

describe("dispatchCommand — sudo", () => {
  it("sudo returns the canonical 'not in sudoers' message with the user's name", () => {
    expect(dispatchCommand(parseInput("sudo reboot"), ctx)).toEqual({
      kind: "text",
      text: "user12345 is not in the sudoers file.  This incident will be reported.",
    });
  });

  it("sudo with no args still renders the message", () => {
    expect(dispatchCommand(parseInput("sudo"), ctx)).toEqual({
      kind: "text",
      text: "user12345 is not in the sudoers file.  This incident will be reported.",
    });
  });
});

describe("dispatchCommand — exit/logout", () => {
  it("exit returns navigate to /", () => {
    expect(dispatchCommand(parseInput("exit"), ctx)).toEqual({ kind: "navigate", path: "/" });
  });
  it("logout returns navigate to /", () => {
    expect(dispatchCommand(parseInput("logout"), ctx)).toEqual({ kind: "navigate", path: "/" });
  });
});

describe("dispatchCommand — theme", () => {
  it("theme with no args returns current mode text", () => {
    expect(dispatchCommand(parseInput("theme"), ctx)).toEqual({
      kind: "text", text: "current theme: dark",
    });
  });

  it("theme light returns theme kind with mode=light", () => {
    expect(dispatchCommand(parseInput("theme light"), ctx)).toEqual({ kind: "theme", mode: "light" });
  });

  it("theme dark returns theme kind with mode=dark", () => {
    expect(dispatchCommand(parseInput("theme dark"), ctx)).toEqual({ kind: "theme", mode: "dark" });
  });

  it("theme <bogus> returns an invalid-mode text entry", () => {
    expect(dispatchCommand(parseInput("theme neon"), ctx)).toEqual({
      kind: "text",
      text: "theme: invalid mode 'neon'. valid modes: light, dark",
    });
  });
});

describe("dispatchCommand — ls (no args)", () => {
  it("returns a DirectoryListing with 7 items (4 files + 3 dirs)", () => {
    const r = dispatchCommand(parseInput("ls"), ctx);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("DirectoryListing");
      const items = (r.props as { items: Array<{ name: string; kind: string }> }).items;
      expect(items.map((i) => i.name)).toEqual([
        "summary.md", "experience.md", "education.md", "contact",
        "skills/", "projects/", "writing/",
      ]);
      expect(items.filter((i) => i.kind === "file").length).toBe(4);
      expect(items.filter((i) => i.kind === "dir").length).toBe(3);
    }
  });
});

describe("dispatchCommand — cat projects/<slug>.md", () => {
  const withProjects: DispatchContext = {
    ...ctx,
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: [], summary: "" },
    ],
  };

  it("known slug returns ProjectPreview with slug prop", () => {
    expect(dispatchCommand(parseInput("cat projects/01-jump.md"), withProjects)).toEqual({
      kind: "component",
      name: "ProjectPreview",
      props: { slug: "01-jump" },
    });
  });

  it("unknown slug returns bash-style 'No such file or directory'", () => {
    expect(dispatchCommand(parseInput("cat projects/bogus.md"), withProjects)).toEqual({
      kind: "text",
      text: "cat: projects/bogus.md: No such file or directory",
    });
  });

  it("missing .md extension is treated as not found", () => {
    expect(dispatchCommand(parseInput("cat projects/01-jump"), withProjects)).toEqual({
      kind: "text",
      text: "cat: projects/01-jump: No such file or directory",
    });
  });
});

describe("dispatchCommand — ls projects/ and ls writing/", () => {
  const withContent: DispatchContext = {
    ...ctx,
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: ["Vue 3"], summary: "jump summary" },
      { slug: "02-thrivee", title: "Thrivee", year: 2019, stack: [], summary: "thrivee summary" },
    ],
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "hello there" },
    ],
  };

  it("ls projects/ returns files named <slug>.md linking to /work/<slug>", () => {
    const r = dispatchCommand(parseInput("ls projects/"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("DirectoryListing");
      const items = (r.props as { items: Array<{ name: string; kind: string; link?: string }> }).items;
      expect(items).toEqual([
        { name: "01-jump.md", kind: "file", link: "/work/01-jump" },
        { name: "02-thrivee.md", kind: "file", link: "/work/02-thrivee" },
      ]);
    }
  });

  it("ls writing/ returns files named <slug>.md linking to /writing/<slug>", () => {
    const r = dispatchCommand(parseInput("ls writing/"), withContent);
    if (r?.kind === "component") {
      const items = (r.props as { items: Array<{ name: string; kind: string; link?: string }> }).items;
      expect(items).toEqual([
        { name: "hello-world.md", kind: "file", link: "/writing/hello-world" },
      ]);
    }
  });
});
