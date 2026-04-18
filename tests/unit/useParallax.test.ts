import { describe, it, expect, beforeEach } from "vitest";
import { ref } from "vue";
import { useParallax } from "~/composables/useParallax";
import { __resetScrollY } from "~/composables/useScrollY";

describe("useParallax", () => {
  beforeEach(() => {
    __resetScrollY();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
  });

  it("returns a translateY string reflecting scroll * speed", async () => {
    const { transform } = useParallax({ speed: 0.25 });
    Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(transform.value).toBe("translate3d(0, -25px, 0)");
  });

  it("returns translate3d(0,0,0) when reduced motion requested", async () => {
    const { transform } = useParallax({ speed: 0.25, reduced: ref(true) });
    Object.defineProperty(window, "scrollY", { value: 100, writable: true, configurable: true });
    window.dispatchEvent(new Event("scroll"));
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(transform.value).toBe("translate3d(0, 0, 0)");
  });
});
