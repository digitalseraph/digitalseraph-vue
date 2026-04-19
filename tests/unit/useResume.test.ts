import { describe, it, expect, vi } from "vitest";
import { useResume } from "~/composables/useResume";

describe("useResume", () => {
  it("returns the parsed resume shape when queryCollection resolves", async () => {
    const mockResume = {
      header: { name: "Test", title: "Test Role", location: "Remote", email: "a@b", github: "x", linkedin: "y" },
      summary: "test summary",
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      contact: { email: "a@b", github: "x", linkedin: "y" },
    };
    vi.stubGlobal("queryCollection", (name: string) => {
      expect(name).toBe("resume");
      return { first: async () => mockResume };
    });

    const resume = await useResume();
    expect(resume.value?.header.name).toBe("Test");
    expect(resume.value?.summary).toBe("test summary");
  });

  it("returns null when queryCollection yields no data", async () => {
    vi.stubGlobal("queryCollection", () => ({ first: async () => null }));
    const resume = await useResume();
    expect(resume.value).toBeNull();
  });
});
