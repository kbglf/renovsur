import type { PriceComparison } from "./types";

export function isMeaningfulSavings(savings: number, totalAmount: number): boolean {
  if (savings <= 0 || totalAmount <= 0) return false;
  return savings >= Math.max(100, Math.round(totalAmount * 0.05));
}

/** Montant négociable sur un poste (toujours en € total ligne, jamais confondre €/m² avec un total) */
export function savingsFromComparison(c: PriceComparison): number {
  if (c.status === "ok") return 0;
  if (c.scope === "line_total") {
    return Math.min(Math.max(0, c.yourPrice - c.marketAverage), c.yourPrice);
  }
  return 0;
}

export function computeSavingsFromComparisons(
  comparisons: PriceComparison[],
  totalAmount: number,
): number {
  if (totalAmount <= 0) return 0;
  const raw = comparisons.reduce((sum, c) => sum + savingsFromComparison(c), 0);
  return Math.min(Math.round(raw), totalAmount);
}

