/** Similarity above this counts as a duplicate without asking the AI. */
export const DUPLICATE_THRESHOLD = 0.8;
/** Below this, titles are treated as unrelated. */
export const AMBIGUOUS_THRESHOLD = 0.55;

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigrams(value: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (let i = 0; i < value.length - 1; i += 1) {
    const gram = value.slice(i, i + 2);
    counts.set(gram, (counts.get(gram) ?? 0) + 1);
  }
  return counts;
}

/** Sørensen–Dice coefficient over character bigrams, in [0, 1]. */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return a.length === 0 ? 0 : 1;
  if (a.length < 2 || b.length < 2) return 0;

  const left = bigrams(a);
  const right = bigrams(b);

  let overlap = 0;
  let leftTotal = 0;
  for (const [gram, count] of left) {
    leftTotal += count;
    overlap += Math.min(count, right.get(gram) ?? 0);
  }

  const rightTotal = [...right.values()].reduce((sum, n) => sum + n, 0);
  return (2 * overlap) / (leftTotal + rightTotal);
}

export function titleSimilarity(a: string, b: string): number {
  return diceCoefficient(normalizeTitle(a), normalizeTitle(b));
}
