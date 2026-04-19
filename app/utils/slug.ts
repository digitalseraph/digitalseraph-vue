/**
 * Convert a @nuxt/content entry's `stem` into a URL slug.
 * e.g. "work/01-project-one" → "01-project-one"
 */
export function stemToSlug(stem: string): string {
  return stem.split("/").pop() ?? "";
}
