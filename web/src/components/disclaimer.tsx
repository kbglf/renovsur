import { AlertCircle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <p>
        Analyse indicative : règles métier, registres publics (SIRET, RGE) et repères
        prix au m² (ordres de grandeur, pas devis officiel). Ne remplace pas un expert
        BTP, un diagnostiqueur ou un avocat. Vérifiez toujours les chiffres avec l&apos;artisan.
      </p>
    </div>
  );
}
