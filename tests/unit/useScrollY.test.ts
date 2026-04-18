import { describe, it, expect, beforeEach } from "vitest";
import { useScrollY, __resetScrollY } from "~/composables/useScrollY";

describe("useScrollY", () => {
  beforeEach(() => {
    __resetScrollY();
    Object.defineProperty(window, "scrollY", { value: 0, writable: true, configurable: true });
  });

  it("returns a reactive ref initialized to window.scrollY", () => {
    Object.defineProperty(window, "scrollY", { value: 42, writable: true, configurable: true });
    const y = useScrollY();
    expect(y.value).toBe(42);
  });

  it("multiple calls share the same ref (singleton)", () => {
    const a = useScrollY();
    const b = useScrollY();
    expect(a).toBe(b);
  });
});
