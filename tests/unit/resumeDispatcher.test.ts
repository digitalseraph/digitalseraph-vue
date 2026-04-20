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

describe("dispatchCommand — cat writing/<slug>.md", () => {
  const withPosts: DispatchContext = {
    ...ctx,
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "" },
    ],
  };

  it("known slug returns PostPreview", () => {
    expect(dispatchCommand(parseInput("cat writing/hello-world.md"), withPosts)).toEqual({
      kind: "component",
      name: "PostPreview",
      props: { slug: "hello-world" },
    });
  });

  it("unknown slug returns 'No such file or directory'", () => {
    expect(dispatchCommand(parseInput("cat writing/bogus.md"), withPosts)).toEqual({
      kind: "text",
      text: "cat: writing/bogus.md: No such file or directory",
    });
  });
});

describe("dispatchCommand — grep", () => {
  const withContent: DispatchContext = {
    ...ctx,
    resume: {
      ...resume,
      experience: [
        {
          role: "Dev", company: "Cox", location: "Atlanta",
          start: "2021-05", end: "present",
          bullets: ["Led the Vue 3 migration"],
          tech: [],
        },
      ],
      skills: [{ group: "Languages", items: ["TypeScript", "PHP"] }],
    },
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: ["Vue 3"], summary: "URL shortener" },
    ],
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "about Vue" },
    ],
  };

  it("grep with no args returns usage text", () => {
    expect(dispatchCommand(parseInput("grep"), withContent)).toEqual({
      kind: "text",
      text: "grep: missing search term. usage: grep <term>",
    });
  });

  it("grep with no matches returns GrepResults with empty matches", () => {
    const r = dispatchCommand(parseInput("grep zzz-nothing"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      expect(r.name).toBe("GrepResults");
      const props = r.props as { term: string; matches: unknown[] };
      expect(props.term).toBe("zzz-nothing");
      expect(props.matches).toEqual([]);
    }
  });

  it("grep matches across experience bullets, skills, projects, and posts", () => {
    const r = dispatchCommand(parseInput("grep Vue"), withContent);
    expect(r?.kind).toBe("component");
    if (r?.kind === "component") {
      const { matches } = r.props as {
        matches: Array<{ source: string; snippet: string; link?: string }>;
      };
      expect(matches.map((m) => m.source)).toEqual([
        "experience/Cox/0",
        "projects/01-jump",
        "writing/hello-world",
      ]);
      expect(matches.find((m) => m.source === "projects/01-jump")?.link).toBe("/work/01-jump");
      expect(matches.find((m) => m.source === "writing/hello-world")?.link).toBe("/writing/hello-world");
    }
  });

  it("grep is case-insensitive", () => {
    const r = dispatchCommand(parseInput("grep vue"), withContent);
    if (r?.kind === "component") {
      const { matches } = r.props as { matches: Array<{ source: string }> };
      expect(matches.length).toBeGreaterThan(0);
    }
  });

  it("grep joins multiple args into a single term", () => {
    const r = dispatchCommand(parseInput("grep URL shortener"), withContent);
    if (r?.kind === "component") {
      const { term, matches } = r.props as {
        term: string;
        matches: Array<{ source: string }>;
      };
      expect(term).toBe("URL shortener");
      expect(matches.some((m) => m.source === "projects/01-jump")).toBe(true);
    }
  });
});

describe("dispatchCommand — open", () => {
  const withContent: DispatchContext = {
    ...ctx,
    projects: [
      { slug: "01-jump", title: "Jump", year: 2026, stack: [], summary: "" },
    ],
    posts: [
      { slug: "hello-world", title: "Hello", date: "2026-03-12", excerpt: "" },
    ],
  };

  it("open with no args returns usage text", () => {
    expect(dispatchCommand(parseInput("open"), withContent)).toEqual({
      kind: "text",
      text: "open: missing path. usage: open <path>",
    });
  });

  it("open projects/<slug> navigates to /work/<slug>", () => {
    expect(dispatchCommand(parseInput("open projects/01-jump"), withContent)).toEqual({
      kind: "navigate",
      path: "/work/01-jump",
    });
  });

  it("open projects/<slug>.md also navigates (trailing .md tolerated)", () => {
    expect(dispatchCommand(parseInput("open projects/01-jump.md"), withContent)).toEqual({
      kind: "navigate",
      path: "/work/01-jump",
    });
  });

  it("open writing/<slug> navigates to /writing/<slug>", () => {
    expect(dispatchCommand(parseInput("open writing/hello-world"), withContent)).toEqual({
      kind: "navigate",
      path: "/writing/hello-world",
    });
  });

  it("open /about navigates directly to /about (leading slash)", () => {
    expect(dispatchCommand(parseInput("open /about"), withContent)).toEqual({
      kind: "navigate",
      path: "/about",
    });
  });

  it("open projects/bogus returns bash-style No such file or directory", () => {
    expect(dispatchCommand(parseInput("open projects/bogus"), withContent)).toEqual({
      kind: "text",
      text: "open: projects/bogus: No such file or directory",
    });
  });

  it("open writing/bogus returns bash-style error", () => {
    expect(dispatchCommand(parseInput("open writing/bogus"), withContent)).toEqual({
      kind: "text",
      text: "open: writing/bogus: No such file or directory",
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
