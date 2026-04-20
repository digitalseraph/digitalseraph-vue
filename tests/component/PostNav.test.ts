// @vitest-environment nuxt
import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import PostNav from "~/components/writing/PostNav.vue";

describe("PostNav", () => {
  it("renders nothing when both prev and next are null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: { prev: null, next: null },
    });
    expect(wrapper.find("nav").exists()).toBe(false);
  });

  it("renders only the previous link when prev is provided and next is null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: { slug: "older-post", title: "Older Post" },
        next: null,
      },
    });
    expect(wrapper.text()).toContain("previous");
    expect(wrapper.text()).toContain("Older Post");
    expect(wrapper.find(`a[href="/writing/older-post"]`).exists()).toBe(true);
    expect(wrapper.find(`a[href*="next"]`).exists()).toBe(false);
  });

  it("renders only the next link when next is provided and prev is null", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: null,
        next: { slug: "newer-post", title: "Newer Post" },
      },
    });
    expect(wrapper.text()).toContain("next");
    expect(wrapper.text()).toContain("Newer Post");
    expect(wrapper.text()).not.toContain("previous");
    expect(wrapper.find(`a[href="/writing/newer-post"]`).exists()).toBe(true);
  });

  it("renders both links when both are provided", async () => {
    const wrapper = await mountSuspended(PostNav, {
      props: {
        prev: { slug: "older", title: "Older" },
        next: { slug: "newer", title: "Newer" },
      },
    });
    expect(wrapper.text()).toContain("previous");
    expect(wrapper.text()).toContain("next");
    expect(wrapper.find(`a[href="/writing/older"]`).exists()).toBe(true);
    expect(wrapper.find(`a[href="/writing/newer"]`).exists()).toBe(true);
  });
});
