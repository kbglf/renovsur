"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/stripe";

interface PricingCardsProps {
  reportId?: string;
  compact?: boolean;
}

const FEATURES: Record<PlanId, string[]> = {
  complete: [
    "Toutes les alertes détaillées",
    "Comparaison prix vs marché régional",
    "Checklist légale complète (SIRET, TVA, décennale)",
    "Économies potentielles chiffrées",
    "Export PDF",
  ],
  negotiation: [
    "Tout le Rapport Essentiel",
    "Lettre de négociation prête à envoyer",
    "Points de levier chiffrés",
    "Script pour appeler l'artisan",
  ],
  compare3: [
    "3 rapports Essentiel (19 € × 3 = 57 €)",
    "Parfait pour comparer 3 artisans",
    "Crédits utilisables quand vous voulez",
    "Pas d'abonnement — paiement unique",
  ],
};

export function PricingCards({ reportId, compact }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  const planIds: PlanId[] = compact
    ? ["complete", "negotiation"]
    : ["compare3", "complete", "negotiation"];

  async function handleCheckout(planId: PlanId) {
    if (planId !== "compare3" && !reportId) {
      window.location.href = "/analyser";
      return;
    }

    setLoading(planId);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: reportId ?? null, planId }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else if (data.demo) {
        if (data.credits) {
          window.location.href = `/analyser?credits=${data.credits}`;
        } else {
          window.location.reload();
        }
      } else if (data.alreadyPaid) {
        window.location.reload();
      } else {
        throw new Error(data.error || "Erreur de paiement");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de lancer le paiement.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div>
      {error && (
        <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div
        className={`grid gap-6 ${
          compact ? "md:grid-cols-2" : "lg:grid-cols-3"
        }`}
      >
        {planIds.map((id) => {
          const plan = PLANS[id];
          const isPopular = id === "compare3" && !compact;
          const isNegotiation = id === "negotiation" && compact;

          return (
            <div
              key={id}
              className={`relative rounded-3xl border p-8 ${
                isPopular || isNegotiation
                  ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-100"
                  : "border-slate-200 bg-white"
              }`}
            >
              {(isPopular || isNegotiation) && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-1 text-xs font-bold text-white">
                  {isPopular ? "Meilleur rapport qualité/prix" : "Le plus complet"}
                </span>
              )}
              <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
              <p className="mt-6 text-4xl font-bold text-slate-900">
                {plan.priceLabel}
                <span className="text-base font-normal text-slate-500">
                  {" "}
                  / {plan.perUnit}
                </span>
              </p>
              <ul className="mt-6 space-y-3 text-sm text-slate-700">
                {FEATURES[id].map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleCheckout(id)}
                disabled={loading !== null}
                className={`mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition ${
                  isPopular || isNegotiation
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-300 text-slate-800 hover:bg-slate-50"
                } disabled:opacity-60`}
              >
                {loading === id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {id === "compare3" ? "Acheter le pack" : "Débloquer ce devis"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
