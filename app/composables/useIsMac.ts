import { ref, onMounted } from "vue";

export function useIsMac() {
  const isMac = ref(false);
  onMounted(() => {
    if (typeof navigator === "undefined") return;
    isMac.value = /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
  });
  return isMac;
}
