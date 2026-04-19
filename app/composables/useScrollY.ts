import { ref, type Ref } from "vue";

let singleton: Ref<number> | null = null;
let rafId = 0;
let listening = false;

function tick() {
  if (!singleton) return;
  singleton.value = window.scrollY;
  rafId = 0;
}

function onScroll() {
  if (rafId) return;
  rafId = requestAnimationFrame(tick);
}

export function useScrollY(): Ref<number> {
  if (singleton) return singleton;
  const initial = typeof window !== "undefined" ? window.scrollY : 0;
  singleton = ref(initial);
  if (typeof window !== "undefined" && !listening) {
    window.addEventListener("scroll", onScroll, { passive: true });
    listening = true;
  }
  return singleton;
}

export function __resetScrollY() {
  if (typeof window !== "undefined" && listening) {
    window.removeEventListener("scroll", onScroll);
  }
  if (rafId) {
    cancelAnimationFrame(rafId);
  }
  singleton = null;
  rafId = 0;
  listening = false;
}
