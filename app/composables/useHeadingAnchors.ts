import { ref, onMounted, onBeforeUnmount, type Ref } from "vue";

/**
 * Wires up click handlers on every h2/h3 inside the given article root so
 * that clicking the heading copies its permalink to the clipboard. Emits a
 * transient `toast` ref that consumers render for user feedback.
 *
 * The actual `#` hover glyph is a pure-CSS affordance wired in prose.css.
 */
export function useHeadingAnchors(rootRef: Ref<HTMLElement | null>) {
  const toast = ref<string>("");
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function onClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;
    const heading = target?.closest("h2, h3");
    if (!heading || !(heading instanceof HTMLElement)) return;
    const id = heading.id;
    if (!id) return;

    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard?.writeText(url).then(
      () => flash("link copied"),
      () => flash("copy failed"),
    );

    // Update the URL hash without forcing a re-scroll
    history.replaceState(null, "", `#${id}`);
  }

  function flash(msg: string) {
    toast.value = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.value = ""; }, 1500);
  }

  onMounted(() => {
    rootRef.value?.addEventListener("click", onClick);
  });
  onBeforeUnmount(() => {
    rootRef.value?.removeEventListener("click", onClick);
    if (toastTimer) clearTimeout(toastTimer);
  });

  return { toast };
}
