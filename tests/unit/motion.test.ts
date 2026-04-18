import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useMotionStore } from "~/stores/motion";

describe("motion store", () => {
  beforeEach(() => setActivePinia(createPinia()));

  it("detects reduced-motion preference", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const motion = useMotionStore();
    motion.init();
    expect(motion.reduced).toBe(true);
  });

  it("defaults to not reduced when query unmatched", () => {
    vi.stubGlobal("matchMedia", () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const motion = useMotionStore();
    motion.init();
    expect(motion.reduced).toBe(false);
  });
});
