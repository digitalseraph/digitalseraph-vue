export interface Candidate {
  path: string;
  label: string;
}

/**
 * Return the single closest candidate to `query` by Levenshtein distance over
 * its path — or null if nothing is close enough. "Close enough" is a distance
 * ≤ max(3, Math.floor(query.length / 3)), capped at 8, to avoid suggesting
 * totally unrelated routes for garbage input.
 */
export function didYouMean(query: string, candidates: Candidate[]): Candidate | null {
  const q = query.toLowerCase();
  if (q.length < 2 || candidates.length === 0) return null;

  const threshold = Math.min(8, Math.max(3, Math.floor(q.length / 3)));

  let best: { candidate: Candidate; distance: number } | null = null;
  for (const c of candidates) {
    const d = Math.min(
      levenshtein(q, c.path.toLowerCase()),
      levenshtein(q, c.label.toLowerCase()),
    );
    if (d <= threshold && (!best || d < best.distance)) {
      best = { candidate: c, distance: d };
    }
  }
  return best?.candidate ?? null;
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const al = a.length, bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}
