import { ref, watch, onBeforeUnmount, type Ref } from "vue";

interface RevealOptions {
  rootMargin?: string;
  threshold?: number;
  once?: boolean;
}

export function useReveal(target: Ref<HTMLElement | null>, opts: RevealOptions = {}) {
  const visible = ref(false);
  let observer: IntersectionObserver | null = null;

  const start = (el: HTMLElement) => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.value = true;
            if (opts.once !== false) observer?.disconnect();
          } else if (opts.once === false) {
            visible.value = false;
          }
        }
      },
      {
        rootMargin: opts.rootMargin ?? "0px 0px -10% 0px",
        threshold: opts.threshold ?? 0.1,
      }
    );
    observer.observe(el);
  };

  watch(
    target,
    (el) => {
      if (el) start(el);
    },
    { immediate: true }
  );

  onBeforeUnmount(() => observer?.disconnect());

  return { visible };
}
