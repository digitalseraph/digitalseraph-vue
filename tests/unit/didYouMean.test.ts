import { describe, it, expect } from "vitest";
import { didYouMean } from "~/utils/didYouMean";

const candidates = [
  { path: "/about", label: "about" },
  { path: "/work", label: "work" },
  { path: "/work/01-jump", label: "Jump" },
  { path: "/work/02-thrivee", label: "Thrivee" },
  { path: "/writing", label: "writing" },
  { path: "/resume", label: "resume" },
];

describe("didYouMean", () => {
  it("returns null for empty query", () => {
    expect(didYouMean("", candidates)).toBeNull();
  });

  it("returns null for a single char (too ambiguous)", () => {
    expect(didYouMean("a", candidates)).toBeNull();
  });

  it("returns null when no candidates are close enough", () => {
    expect(didYouMean("xyzzy-totally-unrelated-path", candidates)).toBeNull();
  });

  it("finds the closest match for a slight misspelling", () => {
    expect(didYouMean("/wrok", candidates)?.path).toBe("/work");
  });

  it("matches against labels, not just paths (e.g. project titles)", () => {
    expect(didYouMean("jump", candidates)?.path).toBe("/work/01-jump");
  });

  it("matches a slightly misspelled project slug", () => {
    expect(didYouMean("/work/01-junp", candidates)?.path).toBe("/work/01-jump");
  });

  it("returns null for empty candidates array", () => {
    expect(didYouMean("/work", [])).toBeNull();
  });
});
