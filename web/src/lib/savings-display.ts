import type { PriceComparison, QuoteInput } from "./types";
import {
  computeSavingsFromComparisons,
  isMeaningfulSavings,
  savingsFromComparison,
} from "./price-savings";

export { isMeaningfulSavings } from "./price-savings";

export interface SavingsBreakdownItem {
  label: string;
  amount: number;
  detail: string;
}

export interface SavingsDisplay {
  total: number;
  items: SavingsBreakdownItem[];
  showProminent: boolean;
}

export interface PaymentAdvice {
  depositPercent: number;
  totalAmount: number;
  upfrontAtCurrent: number;
  upfrontAtRecommended: number;
}

export function buildPaymentAdvice(input: QuoteInput): PaymentAdvice | null {
  const pct = input.depositPercent;
  if (!pct || pct <= 30 || input.totalAmount <= 0) return null;

  return {
    depositPercent: pct,
    totalAmount: input.totalAmount,
    upfrontAtCurrent: Math.round(input.totalAmount * (pct / 100)),
    upfrontAtRecommended: Math.round(input.totalAmount * 0.3),
  };
}

/** Aligné sur la section « Comparaison des prix » (même chiffres) */
export function buildSavingsDisplay(
  comparisons: PriceComparison[],
  input: QuoteInput,
  score: number,
): SavingsDisplay | null {
  const items = comparisons
    .filter((c) => c.status !== "ok")
    .map((c) => ({
      label: c.item.length > 55 ? `${c.item.slice(0, 55)}…` : c.item,
      amount: savingsFromComparison(c),
      detail: c.explanation ?? "",
    }))
    .filter((i) => i.amount > 0);

  const total = computeSavingsFromComparisons(comparisons, input.totalAmount);
  if (total <= 0) return null;

  return {
    total,
    items,
    showProminent: score >= 40 && isMeaningfulSavings(total, input.totalAmount),
  };
}
