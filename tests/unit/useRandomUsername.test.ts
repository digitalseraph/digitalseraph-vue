import { describe, it, expect, beforeEach, vi } from "vitest";
import { useRandomUsername } from "~/composables/useRandomUsername";

describe("useRandomUsername", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("generates a user<5-digit> string on first call", () => {
    const name = useRandomUsername();
    expect(name).toMatch(/^user\d{5}$/);
  });

  it("persists the same value across calls in the same session", () => {
    const a = useRandomUsername();
    const b = useRandomUsername();
    expect(a).toBe(b);
  });

  it("reads an existing sessionStorage value instead of regenerating", () => {
    sessionStorage.setItem("ds-terminal-user", "user99999");
    expect(useRandomUsername()).toBe("user99999");
  });

  it("generates pads-to-5-digits values (10000-99999)", () => {
    // Force the lower bound
    vi.spyOn(Math, "random").mockReturnValue(0);
    sessionStorage.clear();
    const a = useRandomUsername();
    expect(a).toBe("user10000");

    // Force the upper bound
    vi.spyOn(Math, "random").mockReturnValue(0.999999);
    sessionStorage.clear();
    const b = useRandomUsername();
    expect(b).toBe("user99999");
  });
});
