import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useThemeStore } from "~/stores/theme";

describe("theme store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }));
  });

  it("defaults to dark", () => {
    const theme = useThemeStore();
    expect(theme.mode).toBe("dark");
  });

  it("reads stored preference if present", () => {
    localStorage.setItem("ds-theme", "light");
    const theme = useThemeStore();
    theme.init();
    expect(theme.mode).toBe("light");
  });

  it("toggle flips mode and persists", () => {
    const theme = useThemeStore();
    theme.init();
    theme.toggle();
    expect(theme.mode).toBe("light");
    expect(localStorage.getItem("ds-theme")).toBe("light");
    expect(document.documentElement.dataset.theme).toBe("light");
  });
});
