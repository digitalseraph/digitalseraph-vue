/**
 * Format an ISO date string like "2026-03-12" for display on post UI surfaces.
 * Uses en-US with a short month and numeric day/year: "Mar 12, 2026".
 */
export function fmtPostDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
