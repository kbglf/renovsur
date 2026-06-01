import type { Alert, QuoteInput } from "./types";
import { computeTotalSavingsEstimate, isMeaningfulSavings } from "./analyzer";

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

export function buildSavingsDisplay(
  alerts: Alert[],
  input: QuoteInput,
  score: number,
): SavingsDisplay | null {
  const items: SavingsBreakdownItem[] = [];

  for (const alert of alerts) {
    if (!alert.id.startsWith("price-")) continue;
    if (!alert.savingsEstimate || alert.savingsEstimate <= 0) continue;

    items.push({
      label: "Prix au-dessus du repère",
      amount: alert.savingsEstimate,
      detail:
        "Écart par rapport à nos repères indicatifs au m² — en négociant le tarif ou les postes, vous pourriez payer moins sur le même chantier.",
    });
  }

  const total = computeTotalSavingsEstimate(alerts, input.totalAmount);
  if (total <= 0) return null;

  return {
    total,
    items,
    showProminent: score >= 40 && isMeaningfulSavings(total, input.totalAmount),
  };
}
