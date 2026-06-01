import { PiggyBank } from "lucide-react";
import type { SavingsDisplay } from "@/lib/savings-display";
import { formatEuro } from "@/lib/utils";

export function SavingsInsightCard({ savings }: { savings: SavingsDisplay }) {
  const cautious = !savings.showProminent;

  return (
    <div
      className={`mt-4 rounded-2xl border p-4 sm:p-5 ${
        cautious
          ? "border-blue-200 bg-blue-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
    >
      <div className="flex gap-3">
        <PiggyBank
          className={`h-5 w-5 shrink-0 ${cautious ? "text-blue-700" : "text-emerald-700"}`}
        />
        <div className="min-w-0 flex-1 text-sm">
          <p className={`font-semibold ${cautious ? "text-blue-950" : "text-emerald-950"}`}>
            {cautious
              ? "Économie possible sur le prix (estimation)"
              : "Économie possible sur le prix du devis"}
          </p>
          <p
            className={`mt-2 leading-relaxed ${cautious ? "text-blue-900" : "text-emerald-900"}`}
          >
            Jusqu&apos;à <strong>{formatEuro(savings.total)}</strong> en négociant des postes
            au-dessus de nos repères (même surface, même prestation). Montant indicatif — pas
            garanti, et sans compter l&apos;acompte.
          </p>

          {savings.items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {savings.items.map((item) => (
                <li
                  key={item.label}
                  className={`rounded-lg px-3 py-2 ${
                    cautious ? "bg-white/80 text-blue-950" : "bg-white/80 text-emerald-950"
                  }`}
                >
                  <span className="font-medium">
                    {item.label} — {formatEuro(item.amount)}
                  </span>
                  <p className="mt-0.5 text-xs leading-relaxed opacity-90">{item.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
