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
          {cautious ? (
            <>
              <p className="font-semibold text-blue-950">
                Ce montant n&apos;est pas à payer en plus
              </p>
              <p className="mt-2 leading-relaxed text-blue-900">
                Environ <strong>{formatEuro(savings.total)}</strong> correspond à ce que vous
                pourriez <strong>économiser</strong> en négociant (surtout l&apos;acompte),
                une fois les risques bloquants réglés. Ce n&apos;est pas un supplément à régler
                plus tard.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold text-emerald-950">
                Économie possible (estimation)
              </p>
              <p className="mt-2 leading-relaxed text-emerald-900">
                Jusqu&apos;à <strong>{formatEuro(savings.total)}</strong> en négociant les
                points signalés dans ce rapport — montant indicatif, pas garanti.
              </p>
            </>
          )}

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
