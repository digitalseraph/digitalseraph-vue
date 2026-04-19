import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref } from "vue";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useResume } from "~/composables/useResume";

const { queryCollectionMock, useAsyncDataMock } = vi.hoisted(() => ({
  queryCollectionMock: vi.fn(),
  useAsyncDataMock: vi.fn(),
}));

mockNuxtImport("queryCollection", () => queryCollectionMock);
mockNuxtImport("useAsyncData", () => useAsyncDataMock);

describe("useResume", () => {
  beforeEach(() => {
    queryCollectionMock.mockReset();
    useAsyncDataMock.mockReset();
    useAsyncDataMock.mockImplementation(async (_key: string, fn: () => Promise<any>) => ({
      data: ref(await fn()),
    }));
  });

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
    queryCollectionMock.mockImplementation((name: string) => {
      expect(name).toBe("resume");
      return { first: async () => mockResume };
    });

    const resume = await useResume();
    expect(resume.value?.header.name).toBe("Test");
    expect(resume.value?.summary).toBe("test summary");
  });

  it("returns null when queryCollection yields no data", async () => {
    queryCollectionMock.mockImplementation(() => ({ first: async () => null }));
    const resume = await useResume();
    expect(resume.value).toBeNull();
  });
});
