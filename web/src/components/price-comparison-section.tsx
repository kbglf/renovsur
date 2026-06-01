import { Info } from "lucide-react";
import type { PriceComparison } from "@/lib/types";
import { BENCHMARK_DISCLAIMER } from "@/lib/analyzer/price-benchmarks";
import { formatEuro } from "@/lib/utils";

function scopeLabel(c: PriceComparison): string {
  if (c.scope === "per_m2") return "Comparaison au m²";
  if (c.scope === "line_total") return "Total du poste";
  return "Total devis";
}

function priceColumnHeader(c: PriceComparison): { yours: string; market: string } {
  if (c.scope === "per_m2") {
    return { yours: "Votre devis (€/m²)", market: "Repère marché (€/m²)" };
  }
  return { yours: "Votre devis", market: "Repère indicatif" };
}

export function PriceComparisonSection({
  comparisons,
}: {
  comparisons: PriceComparison[];
}) {
  if (comparisons.length === 0) {
    return (
      <section className="mt-12 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-bold text-slate-900">Comparaison des prix</h2>
        <p className="mt-2 text-sm text-slate-600">
          Aucune comparaison au m² n&apos;a pu être calculée : indiquez les surfaces
          (ex. « 35 m² ») dans le devis ou le champ surface lors de l&apos;analyse.
          Sans quantité, nous ne comparons pas un total à un prix au m² (ce qui serait
          trompeur).
        </p>
      </section>
    );
  }

  return (
    <section className="mt-12 print:break-inside-avoid">
      <h2 className="text-xl font-bold text-slate-900">Comparaison des prix</h2>
      <p className="mt-2 text-sm text-slate-600">
        Chaque ligne explique ce qui est dans <strong>votre devis</strong> et ce qui
        sert de <strong>repère</strong> (même unité, même surface quand elle est connue).
      </p>

      <div className="mt-4 space-y-4">
        {comparisons.map((c) => {
          const headers = priceColumnHeader(c);
          return (
            <article
              key={`${c.item}-${c.scope}`}
              className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-900">{c.item}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {scopeLabel(c)}
                </span>
                {c.quantity && c.unit && (
                  <span className="text-xs text-slate-500">
                    Surface retenue : {c.quantity} {c.unit}
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{headers.yours}</p>
                  <p className="text-lg font-bold text-slate-900">
                    {c.scope === "per_m2"
                      ? `${c.yourPrice.toLocaleString("fr-FR")} €/m²`
                      : formatEuro(c.yourPrice)}
                  </p>
                  {c.yourUnitPrice !== undefined && c.scope === "line_total" && (
                    <p className="text-xs text-slate-600">
                      soit ~{c.yourUnitPrice} €/m² sur {c.quantity} m²
                    </p>
                  )}
                </div>
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-xs text-slate-500">{headers.market}</p>
                  <p className="text-lg font-bold text-slate-700">
                    {c.scope === "per_m2"
                      ? `${c.marketAverage.toLocaleString("fr-FR")} €/m²`
                      : formatEuro(c.marketAverage)}
                  </p>
                  {c.marketUnitPrice !== undefined && c.scope === "line_total" && (
                    <p className="text-xs text-slate-600">
                      repère ~{c.marketUnitPrice} €/m² × {c.quantity} m²
                    </p>
                  )}
                </div>
                <div
                  className={`rounded-lg px-3 py-2 ${
                    c.status === "ok"
                      ? "bg-emerald-50"
                      : c.status === "high"
                        ? "bg-amber-50"
                        : "bg-red-50"
                  }`}
                >
                  <p className="text-xs text-slate-500">Écart</p>
                  <p
                    className={`text-lg font-bold ${
                      c.status === "ok" ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {c.deviationPercent > 0 ? "+" : ""}
                    {c.deviationPercent} %
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {c.explanation ??
                  `Votre devis : ${formatEuro(c.yourPrice)} — repère indicatif : ${formatEuro(c.marketAverage)} (${c.deviationPercent > 0 ? "+" : ""}${c.deviationPercent} %).`}
              </p>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{BENCHMARK_DISCLAIMER}</p>
      </div>
    </section>
  );
}
