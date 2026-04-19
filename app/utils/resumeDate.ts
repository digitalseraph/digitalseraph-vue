const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthOf(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  const mi = parseInt(m, 10) - 1;
  return `${MONTHS[mi] ?? m} ${y}`;
}

/**
 * Terminal date format. `"present"` passes through lowercased.
 * Use in on-screen terminal views.
 */
export function fmtDate(yyyyMm: string): string {
  if (yyyyMm === "present") return "present";
  return monthOf(yyyyMm);
}

/**
 * Print date format. `"present"` → `"Present"` (capitalized for résumé typography).
 * Use in ResumePrintView.
 */
export function fmtDatePrint(yyyyMm: string): string {
  if (yyyyMm === "present") return "Present";
  return monthOf(yyyyMm);
}
