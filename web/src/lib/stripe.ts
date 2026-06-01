import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

/**
 * Paiement à l'acte — pas d'abonnement.
 * Plus le prix monte, plus le rapport est complet.
 */
export const PLANS = {
  complete: {
    id: "complete" as const,
    name: "Rapport Essentiel",
    price: 1900,
    priceLabel: "19 €",
    perUnit: "par devis",
    description: "Toutes les alertes + prix marché + checklist légale complète",
    tier: 1,
  },
  negotiation: {
    id: "negotiation" as const,
    name: "Rapport Négociation",
    price: 3900,
    priceLabel: "39 €",
    perUnit: "par devis",
    description: "Tout l'Essentiel + lettre de négociation + leviers chiffrés",
    tier: 2,
  },
  compare3: {
    id: "compare3" as const,
    name: "Pack Comparer 3 devis",
    price: 4900,
    priceLabel: "49 €",
    perUnit: "3 rapports essentiels",
    description: "Idéal avant de choisir un artisan — 3 analyses complètes à utiliser quand vous voulez",
    tier: 0,
    credits: 3,
    creditPlan: "complete" as const,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3003";
}
