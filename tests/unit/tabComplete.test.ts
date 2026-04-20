import { describe, it, expect } from "vitest";
import { getCompletions } from "~/utils/tabComplete";

const ctx = {
  commands: [
    "whoami", "cat summary.md", "cat experience.md", "cat education.md",
    "ls", "ls skills/", "ls projects/", "ls writing/",
    "contact", "help", "clear", "pdf",
    "date", "uname", "echo", "sudo", "exit", "logout", "theme", "grep",
  ],
  projects: ["01-jump", "02-thrivee-hipaa", "03-gofan-docker"],
  posts: ["hello-world", "building-the-site"],
};

describe("getCompletions", () => {
  it("completes a unique command prefix", () => {
    const r = getCompletions("who", ctx);
    expect(r.completion).toBe("whoami");
    expect(r.candidates).toEqual([]);
  });

  it("returns multiple candidates when the prefix is ambiguous", () => {
    const r = getCompletions("c", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual(expect.arrayContaining(["cat summary.md", "contact", "clear"]));
  });

  it("completes a partial project slug after 'cat projects/'", () => {
    const r = getCompletions("cat projects/01", ctx);
    expect(r.completion).toBe("cat projects/01-jump.md");
    expect(r.candidates).toEqual([]);
  });

  it("lists multiple project candidates", () => {
    const r = getCompletions("cat projects/0", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual([
      "cat projects/01-jump.md",
      "cat projects/02-thrivee-hipaa.md",
      "cat projects/03-gofan-docker.md",
    ]);
  });

  it("completes a partial post slug after 'cat writing/'", () => {
    const r = getCompletions("cat writing/hello", ctx);
    expect(r.completion).toBe("cat writing/hello-world.md");
  });

  it("returns null completion + empty candidates when nothing matches", () => {
    const r = getCompletions("xyz", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual([]);
  });

  it("matches case-insensitively but returns the canonical completion", () => {
    const r = getCompletions("WHO", ctx);
    expect(r.completion).toBe("whoami");
  });

  it("lists the three ls directory variants for 'ls '", () => {
    const r = getCompletions("ls ", ctx);
    expect(r.completion).toBeNull();
    expect(r.candidates).toEqual(expect.arrayContaining([
      "ls skills/", "ls projects/", "ls writing/",
    ]));
  });
});
