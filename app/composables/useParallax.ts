import { computed, type Ref } from "vue";
import { useScrollY } from "./useScrollY";

interface ParallaxOptions {
  speed: number;
  reduced?: Ref<boolean>;
}

export function useParallax(opts: ParallaxOptions) {
  const y = useScrollY();
  const transform = computed(() => {
    if (opts.reduced?.value) return "translate3d(0, 0, 0)";
    const offset = -y.value * opts.speed;
    return `translate3d(0, ${offset}px, 0)`;
  });
  return { transform };
}
