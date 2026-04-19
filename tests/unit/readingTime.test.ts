// tests/unit/readingTime.test.ts
import { describe, it, expect } from "vitest";
import { readingMinutes } from "~/utils/readingTime";

describe("readingMinutes", () => {
  it("returns 1 for an empty string (minimum floor)", () => {
    expect(readingMinutes("")).toBe(1);
  });

  it("returns 1 for 220 words (exactly one minute at 220 wpm)", () => {
    const text = Array(220).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(1);
  });

  it("returns 2 for 440 words", () => {
    const text = Array(440).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(2);
  });

  it("returns 10 for 2200 words", () => {
    const text = Array(2200).fill("word").join(" ");
    expect(readingMinutes(text)).toBe(10);
  });

  it("returns 1 when input is whitespace-only", () => {
    expect(readingMinutes("   \n\t   ")).toBe(1);
  });

  it("returns 1 when input is null/undefined (defensive)", () => {
    expect(readingMinutes(null as any)).toBe(1);
    expect(readingMinutes(undefined as any)).toBe(1);
  });
});
