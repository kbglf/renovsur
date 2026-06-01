import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getExampleReport } from "@/lib/example-report";
import { countAlerts, computeLegalPercent } from "@/lib/free-tier";
import { ResultatsClient } from "@/app/resultats/[id]/resultats-client";

export const metadata = {
  title: "Exemple de rapport complet",
  description:
    "Découvrez un rapport RénovSûr type : alertes, conformité légale, vérification SIRET et analyse décennale.",
};

export default function ExempleRapportPage() {
  const report = getExampleReport();

  return (
    <>
      <div className="border-b border-emerald-100 bg-emerald-50">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
            <Sparkles className="h-4 w-4 shrink-0" />
            Rapport de démonstration — devis fictif, sans paiement
          </p>
          <Link
            href="/analyser"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Analyser mon vrai devis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <ResultatsClient
        reportId={report.id}
        initialReport={report}
        alertCounts={countAlerts(report.alerts)}
        legalScorePercent={computeLegalPercent(report.legalChecks)}
        realSavings={report.totalSavingsEstimate}
        demoMode
      />
    </>
  );
}
