// tests/unit/postNav.test.ts
import { describe, it, expect } from "vitest";
import { getPostSiblings } from "~/utils/postNav";

const posts = [
  { stem: "writing/2026-04-10-third", title: "Third post", date: "2026-04-10" },
  { stem: "writing/2026-03-12-second", title: "Second post", date: "2026-03-12" },
  { stem: "writing/2026-02-04-first", title: "First post", date: "2026-02-04" },
];

describe("getPostSiblings", () => {
  it("finds prev and next when current is in the middle", () => {
    const result = getPostSiblings(posts, "writing/2026-03-12-second");
    expect(result.prev).toEqual({ slug: "2026-02-04-first", title: "First post" });
    expect(result.next).toEqual({ slug: "2026-04-10-third", title: "Third post" });
  });

  it("returns null prev for the oldest post (no older)", () => {
    const result = getPostSiblings(posts, "writing/2026-02-04-first");
    expect(result.prev).toBeNull();
    expect(result.next).toEqual({ slug: "2026-03-12-second", title: "Second post" });
  });

  it("returns null next for the newest post (no newer)", () => {
    const result = getPostSiblings(posts, "writing/2026-04-10-third");
    expect(result.prev).toEqual({ slug: "2026-03-12-second", title: "Second post" });
    expect(result.next).toBeNull();
  });

  it("returns both null when current stem is not in the list", () => {
    const result = getPostSiblings(posts, "writing/2026-05-01-ghost");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("returns both null for a single-post array", () => {
    const single = [{ stem: "writing/only", title: "Only post", date: "2026-01-01" }];
    const result = getPostSiblings(single, "writing/only");
    expect(result.prev).toBeNull();
    expect(result.next).toBeNull();
  });

  it("derives slug by dropping the directory prefix", () => {
    const result = getPostSiblings(posts, "writing/2026-03-12-second");
    expect(result.prev?.slug).toBe("2026-02-04-first");
    expect(result.next?.slug).toBe("2026-04-10-third");
  });
});
