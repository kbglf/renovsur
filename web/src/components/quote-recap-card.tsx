"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import { WORK_TYPE_LABELS, REGION_LABELS } from "@/lib/analyzer/price-benchmarks";
import { extractQuoteTotals } from "@/lib/quote-parse";
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
  const [showSourceText, setShowSourceText] = useState(false);
  const { input } = report;
  const fullyHidden = isQuoteFullyHidden(input.quoteText);
  const showPreview = !fullyHidden && !isPaid;
  const workLines = input.lines.filter((l) => l.description?.trim() && l.total);
  const totals = extractQuoteTotals(
    fullyHidden ? "" : input.quoteText,
  );

  const artisan =
    input.artisanName?.trim() ||
    input.quoteText.split("\n").find((l) => l.trim().length > 2)?.trim().slice(0, 80);

  const displayTtc = totals.ttc ?? (input.totalAmount > 0 ? input.totalAmount : undefined);

  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-slate-900">Devis analysé</h2>
          <p className="mt-1 text-sm text-slate-600">
            Un seul devis : le tableau liste les <strong>postes de travaux</strong>, les
            totaux HT/TTC sont affichés une seule fois ci-dessous (pas mélangés aux lignes).
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
              <div className="sm:col-span-2">
                <dt className="font-medium text-slate-500">Acompte indiqué</dt>
                <dd className="text-slate-900">{input.depositPercent} %</dd>
                {input.depositPercent > 30 && input.totalAmount > 0 && (
                  <p className="mt-1 text-xs leading-relaxed text-amber-800">
                    Au-delà de 30 %, vous avancez plus d&apos;argent au départ (le solde suit
                    plus tard — ce n&apos;est pas une réduction du prix total).
                  </p>
                )}
              </div>
            )}
          </dl>

          {workLines.length > 0 && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-800">Postes de travaux (hors totaux)</p>
              <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Description</th>
                      <th className="px-3 py-2 font-semibold text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {workLines.map((line, i) => (
                      <tr key={`${line.description}-${i}`} className="border-t border-slate-100">
                        <td className="px-3 py-2 text-slate-800">{line.description}</td>
                        <td className="px-3 py-2 text-right font-medium text-slate-900">
                          {formatEuro(line.total!)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(totals.ht || totals.tva || displayTtc) && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
              <p className="text-sm font-semibold text-emerald-950">Totaux du devis</p>
              <dl className="mt-2 grid gap-1 text-sm sm:grid-cols-3">
                {totals.ht !== undefined && (
                  <div>
                    <dt className="text-slate-600">Total HT</dt>
                    <dd className="font-semibold text-slate-900">{formatEuro(totals.ht)}</dd>
                  </div>
                )}
                {totals.tva !== undefined && (
                  <div>
                    <dt className="text-slate-600">TVA</dt>
                    <dd className="font-semibold text-slate-900">{formatEuro(totals.tva)}</dd>
                  </div>
                )}
                {displayTtc !== undefined && (
                  <div>
                    <dt className="text-slate-600">Total TTC</dt>
                    <dd className="font-semibold text-emerald-800">{formatEuro(displayTtc)}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {showPreview && (
            <div className="mt-4">
              <p className="text-xs font-medium text-slate-500">Extrait du texte source</p>
              <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                {input.quoteText}
              </pre>
            </div>
          )}

          {!fullyHidden && isPaid && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowSourceText((v) => !v)}
                className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-emerald-700"
              >
                {showSourceText ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Masquer le texte source du devis
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Afficher le texte source du devis (copie brute)
                  </>
                )}
              </button>
              {showSourceText && (
                <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs leading-relaxed text-slate-700">
                  {input.quoteText}
                </pre>
              )}
            </div>
          )}

          {fullyHidden && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Texte intégral : dans le rapport complet (19 €). Les postes ci-dessus restent
              fidèles à votre analyse.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
