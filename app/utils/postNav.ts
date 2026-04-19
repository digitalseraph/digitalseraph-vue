// app/utils/postNav.ts
import type { PostRef } from "~/types/postNav";

interface PostLike {
  stem: string;
  title: string;
  date: string;
}

/**
 * Given a list of posts and the current post's stem, return the chronologically
 * previous and next post references. "Previous" = older; "Next" = newer.
 */
export function getPostSiblings(
  all: PostLike[],
  currentStem: string
): { prev: PostRef | null; next: PostRef | null } {
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const i = sorted.findIndex((p) => p.stem === currentStem);
  if (i === -1) return { prev: null, next: null };

  const makeRef = (p?: PostLike): PostRef | null =>
    p ? { slug: p.stem.split("/").pop() ?? "", title: p.title } : null;

  return {
    prev: makeRef(sorted[i + 1]),
    next: makeRef(sorted[i - 1]),
  };
}
