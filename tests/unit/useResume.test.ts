import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";

// Hoist mock containers so they're initialized before the mockNuxtImport transforms.
const mocks = vi.hoisted(() => {
  return {
    queryCollection: vi.fn(),
    useAsyncData: vi.fn(),
  };
});

mockNuxtImport("queryCollection", () => mocks.queryCollection);
mockNuxtImport("useAsyncData", () => mocks.useAsyncData);

import { useResume } from "~/composables/useResume";

describe("useResume", () => {
  beforeEach(() => {
    mocks.queryCollection.mockReset();
    mocks.useAsyncData.mockReset();
  });

  it("returns the parsed resume shape when queryCollection resolves", () => {
    const mockResume = {
      header: { name: "Test", title: "Test Role", location: "Remote", email: "a@b", github: "x", linkedin: "y" },
      summary: "test summary",
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      contact: { email: "a@b", github: "x", linkedin: "y" },
    };
    mocks.queryCollection.mockImplementation((name: string) => {
      expect(name).toBe("resume");
      return { first: async () => mockResume };
    });
    mocks.useAsyncData.mockImplementation((_key: string, _fn: any) => ({
      data: ref(mockResume),
    }));

    const resume = useResume();
    expect(resume.value?.header.name).toBe("Test");
    expect(resume.value?.summary).toBe("test summary");
  });

  it("returns null when the underlying data is null", () => {
    mocks.queryCollection.mockImplementation(() => ({ first: async () => null }));
    mocks.useAsyncData.mockImplementation((_key: string, _fn: any) => ({
      data: ref(null),
    }));
    const resume = useResume();
    expect(resume.value).toBeNull();
  });
});
