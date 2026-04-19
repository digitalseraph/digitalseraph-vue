import type { Ref } from "vue";
import type { Resume } from "~/types/resume";

export function useResume(): Ref<Resume | null> {
  const { data } = useAsyncData("resume", () => queryCollection("resume").first());
  return data as Ref<Resume | null>;
}
