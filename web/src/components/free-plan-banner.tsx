import { Lock } from "lucide-react";

export function FreePlanBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
      <div className="flex gap-3">
        <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <p className="font-semibold text-amber-950">Aperçu gratuit — une seule fois</p>
          <p className="mt-1 text-sm text-amber-900/90">
            Vous voyez le score et le nombre d&apos;alertes, pas le détail. Chaque devis
            Essentiel coûte <strong>19 €</strong> (ou <strong>49 €</strong> pour en comparer 3).
            Pas d&apos;abonnement.
          </p>
        </div>
      </div>
    </div>
  );
}
