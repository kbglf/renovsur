import { AlertCircle } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
      <p>
        Analyse indicative basée sur des règles métier et benchmarks publics.
        Ne constitue pas un avis juridique, comptable ou technique certifié.
        En cas de doute, consultez un expert BTP ou un avocat spécialisé.
      </p>
    </div>
  );
}
