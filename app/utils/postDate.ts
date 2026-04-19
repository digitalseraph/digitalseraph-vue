/**
 * Format an ISO date string like "2026-03-12" for display on post UI surfaces.
 * Uses en-US with a short month and numeric day/year: "Mar 12, 2026".
 *
 * Parses the string as a LOCAL date (not UTC). `new Date("2026-03-12")` alone
 * parses as UTC midnight, which shifts the rendered day back by one in any
 * timezone west of UTC — not what post authors expect when they write
 * `date: 2026-03-12` in frontmatter.
 */
export function fmtPostDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return iso; // pass through unknown shapes unchanged
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
