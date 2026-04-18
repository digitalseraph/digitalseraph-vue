import { defineStore } from "pinia";

type ThemeMode = "dark" | "light";

const STORAGE_KEY = "ds-theme";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    mode: "dark" as ThemeMode,
  }),
  actions: {
    init() {
      if (typeof window === "undefined") return;
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored === "dark" || stored === "light") {
        this.mode = stored;
      } else if (window.matchMedia?.("(prefers-color-scheme: light)").matches) {
        this.mode = "light";
      } else {
        this.mode = "dark";
      }
      this.apply();
    },
    toggle() {
      this.mode = this.mode === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, this.mode);
      }
      this.apply();
    },
    apply() {
      if (typeof document === "undefined") return;
      if (this.mode === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    },
  },
});
