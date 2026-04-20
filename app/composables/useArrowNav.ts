import { onMounted, onBeforeUnmount } from "vue";

export function useArrowNav(handlers: { prev?: () => void; next?: () => void }) {
  function onKey(e: KeyboardEvent) {
    // Don't steal keys when the user is typing in an input/textarea/contenteditable
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable)
    )
      return;

    if (e.key === "j" || e.key === "ArrowRight") {
      if (handlers.next) {
        e.preventDefault();
        handlers.next();
      }
    } else if (e.key === "k" || e.key === "ArrowLeft") {
      if (handlers.prev) {
        e.preventDefault();
        handlers.prev();
      }
    }
  }
  onMounted(() => window.addEventListener("keydown", onKey));
  onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
}
