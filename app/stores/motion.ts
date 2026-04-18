import { defineStore } from "pinia";

export const useMotionStore = defineStore("motion", {
  state: () => ({
    reduced: false,
  }),
  actions: {
    init() {
      if (typeof window === "undefined") return;
      const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reduced = mq.matches;
      mq.addEventListener("change", (e) => { this.reduced = e.matches; });
    },
  },
});
