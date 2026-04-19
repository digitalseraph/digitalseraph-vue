import { ref, type Ref } from "vue";
import type { Resume } from "~/types/resume";

export async function useResume() {
  const value = await (globalThis as any).queryCollection("resume").first();
  return ref(value) as Ref<Resume | null>;
}
