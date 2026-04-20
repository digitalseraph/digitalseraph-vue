import { onMounted, onBeforeUnmount, type Ref } from "vue";
import { useMotionStore } from "~/stores/motion";

/**
 * Attaches mousemove listeners to an element so it tilts toward the cursor.
 * Resets on mouseleave. No-op under reduced-motion or on coarse pointers.
 */
export function useCardTilt(elRef: Ref<HTMLElement | null>, maxDeg = 4) {
  const motion = useMotionStore();

  function onMove(e: MouseEvent) {
    const el = elRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    const rotY = nx * maxDeg * 2;
    const rotX = -ny * maxDeg * 2;
    el.style.transform = `perspective(800px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  }
  function onLeave() {
    const el = elRef.value;
    if (!el) return;
    el.style.transform = "";
  }

  onMounted(() => {
    if (typeof window === "undefined") return;
    if (motion.reduced) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    const el = elRef.value;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
  });

  onBeforeUnmount(() => {
    const el = elRef.value;
    if (!el) return;
    el.removeEventListener("mousemove", onMove);
    el.removeEventListener("mouseleave", onLeave);
  });
}
