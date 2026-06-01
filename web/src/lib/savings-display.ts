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
  /** Afficher le montant en vert sous le score (devis plutôt fiable) */
  showProminent: boolean;
}

export function buildSavingsDisplay(
  alerts: Alert[],
  input: QuoteInput,
  score: number,
): SavingsDisplay | null {
  const items: SavingsBreakdownItem[] = [];

  for (const alert of alerts) {
    if (!alert.savingsEstimate || alert.savingsEstimate <= 0) continue;

    if (alert.id === "scam-deposit") {
      const pct = input.depositPercent;
      items.push({
        label: "Acompte trop élevé",
        amount: alert.savingsEstimate,
        detail: pct
          ? `Votre devis demande ${pct} % à la commande. En le ramenant à 30 % (recommandation usuelle), vous évitez de bloquer cet argent trop tôt — ce n'est pas une facture en plus.`
          : "Réduire l'acompte à la commande (30 % maximum conseillé).",
      });
    } else if (alert.id.startsWith("price-")) {
      items.push({
        label: "Prix au-dessus du repère",
        amount: alert.savingsEstimate,
        detail:
          "Écart par rapport à nos repères indicatifs — à faire valider ou négocier avec l'artisan.",
      });
    }
  }

  const total = computeTotalSavingsEstimate(alerts, input.totalAmount);
  if (total <= 0 || !isMeaningfulSavings(total, input.totalAmount)) {
    return items.length > 0 ? { total, items, showProminent: false } : null;
  }

  return {
    total,
    items,
    showProminent: score >= 40,
  };
}
