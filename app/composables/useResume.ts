import type { Ref } from "vue";
import type { Resume } from "~/types/resume";

export async function useResume(): Promise<Ref<Resume | null>> {
  const { data } = await useAsyncData("resume", () =>
    queryCollection("resume").first()
  );
  return data as Ref<Resume | null>;
}
