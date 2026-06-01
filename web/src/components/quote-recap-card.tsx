"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { WORK_TYPE_LABELS, REGION_LABELS } from "@/lib/analyzer/price-benchmarks";
import { formatEuro } from "@/lib/utils";

function isQuoteFullyHidden(text: string): boolean {
  return text.includes("[Contenu masqué");
}

export function QuoteRecapCard({
  report,
  isPaid,
}: {
  report: AnalysisResult;
  isPaid: boolean;
}) {
  const [showFullText, setShowFullText] = useState(false);
  const { input } = report;
  const fullyHidden = isQuoteFullyHidden(input.quoteText);
  const showPreview = !fullyHidden && !isPaid;
  const lines = input.lines.filter((l) => l.description?.trim() || l.total);

  const artisan =
    input.artisanName?.trim() ||
    input.quoteText.split("\n").find((l) => l.trim().length > 2)?.trim().slice(0, 80);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Devis analysé</h2>
          <p className="mt-1 text-sm text-slate-600">
            Voici le document pris en compte pour ce rapport — vérifiez qu&apos;il
            correspond bien au vôtre.
          </p>

          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {artisan && (
              <div>
                <dt className="font-medium text-slate-500">Entreprise / en-tête</dt>
                <dd className="text-slate-900">{artisan}</dd>
              </div>
            )}
            {input.siret && (
              <div>
                <dt className="font-medium text-slate-500">SIRET indiqué</dt>
                <dd className="font-mono text-slate-900">{input.siret}</dd>
              </div>
            )}
            <div>
              <dt className="font-medium text-slate-500">Type de travaux</dt>
              <dd className="text-slate-900">
                {WORK_TYPE_LABELS[input.workType] ?? input.workType}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Région (repères prix)</dt>
              <dd className="text-slate-900">
                {REGION_LABELS[input.region] ?? input.region}
              </dd>
            </div>
            {input.surfaceM2 && input.surfaceM2 > 0 && (
              <div>
                <dt className="font-medium text-slate-500">Surface renseignée</dt>
                <dd className="text-slate-900">{input.surfaceM2} m²</dd>
              </div>
            )}
            {input.depositPercent !== undefined && (
              <div>
                <dt className="font-medium text-slate-500">Acompte indiqué</dt>
                <dd className="text-slate-900">{input.depositPercent} %</dd>
              </div>
            )}
            {input.totalAmount > 0 && (
              <div>
                <dt className="font-medium text-slate-500">Total TTC retenu</dt>
                <dd className="font-semibold text-slate-900">
                  {formatEuro(input.totalAmount)}
                </dd>
              </div>
            )}
          </dl>

          {lines.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-800">Postes détectés dans le devis</p>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={`${line.description}-${i}`} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{line.description}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {line.total ? formatEuro(line.total) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {showPreview && (
            <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
              {input.quoteText}
            </pre>
          )}

          {!fullyHidden && isPaid && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowFullText((v) => !v)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:underline"
              >
                {showFullText ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Masquer le texte du devis
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Voir le texte complet du devis
                  </>
                )}
              </button>
              {showFullText && (
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                  {input.quoteText}
                </pre>
              )}
            </div>
          )}

          {fullyHidden && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Texte intégral du devis : disponible dans le rapport complet (19 €).
              Les postes et montants ci-dessus proviennent bien de votre analyse.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
