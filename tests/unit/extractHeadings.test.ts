import { describe, it, expect } from "vitest";
import { extractHeadings } from "~/utils/extractHeadings";

describe("extractHeadings", () => {
  it("returns an empty list for falsy input", () => {
    expect(extractHeadings(null)).toEqual([]);
    expect(extractHeadings(undefined)).toEqual([]);
    expect(extractHeadings({})).toEqual([]);
  });

  it("extracts h2 headings with id and plain text", () => {
    const body = {
      type: "root",
      children: [
        { tag: "p", children: [{ value: "intro" }] },
        { tag: "h2", props: { id: "section-one" }, children: [{ value: "Section one" }] },
        { tag: "h2", props: { id: "section-two" }, children: [{ value: "Section two" }] },
      ],
    };
    expect(extractHeadings(body)).toEqual([
      { id: "section-one", text: "Section one", depth: 2 },
      { id: "section-two", text: "Section two", depth: 2 },
    ]);
  });

  it("distinguishes h2 and h3 depth", () => {
    const body = {
      children: [
        { tag: "h2", props: { id: "a" }, children: [{ value: "A" }] },
        { tag: "h3", props: { id: "a-1" }, children: [{ value: "A.1" }] },
      ],
    };
    expect(extractHeadings(body)).toEqual([
      { id: "a", text: "A", depth: 2 },
      { id: "a-1", text: "A.1", depth: 3 },
    ]);
  });

  it("ignores h1 and h4+ entirely", () => {
    const body = {
      children: [
        { tag: "h1", props: { id: "title" }, children: [{ value: "Title" }] },
        { tag: "h4", props: { id: "tiny" }, children: [{ value: "Tiny" }] },
      ],
    };
    expect(extractHeadings(body)).toEqual([]);
  });

  it("skips headings without an id or without text", () => {
    const body = {
      children: [
        { tag: "h2", props: {}, children: [{ value: "Unanchored" }] },
        { tag: "h2", props: { id: "empty" }, children: [] },
      ],
    };
    expect(extractHeadings(body)).toEqual([]);
  });

  it("concatenates nested text (e.g. bold/inline-code) inside a heading", () => {
    const body = {
      children: [
        {
          tag: "h2",
          props: { id: "mixed" },
          children: [
            { value: "Using " },
            { tag: "code", children: [{ value: "Vue 3" }] },
            { value: " in anger" },
          ],
        },
      ],
    };
    expect(extractHeadings(body)).toEqual([
      { id: "mixed", text: "Using Vue 3 in anger", depth: 2 },
    ]);
  });

  it("walks a nested tree (e.g. headings inside sections)", () => {
    const body = {
      children: [
        {
          tag: "section",
          children: [
            { tag: "h2", props: { id: "deep" }, children: [{ value: "Deep" }] },
          ],
        },
      ],
    };
    expect(extractHeadings(body)).toEqual([{ id: "deep", text: "Deep", depth: 2 }]);
  });
});
