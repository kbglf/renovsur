import { CalendarClock } from "lucide-react";
import type { PaymentAdvice } from "@/lib/savings-display";
import { formatEuro } from "@/lib/utils";

export function PaymentAdviceCard({ advice }: { advice: PaymentAdvice }) {
  const diff = advice.upfrontAtCurrent - advice.upfrontAtRecommended;

  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
      <div className="flex gap-3">
        <CalendarClock className="h-5 w-5 shrink-0 text-amber-700" />
        <div className="text-sm text-amber-950">
          <p className="font-semibold">Acompte à la commande : {advice.depositPercent} %</p>
          <p className="mt-2 leading-relaxed">
            Aujourd&apos;hui le devis demande environ{" "}
            <strong>{formatEuro(advice.upfrontAtCurrent)}</strong>
            {" "}
            d&apos;acompte (
            {advice.depositPercent} % de {formatEuro(advice.totalAmount)} TTC). Avec 30 %,
            ce serait <strong>{formatEuro(advice.upfrontAtRecommended)}</strong> au départ.
          </p>
          <p className="mt-2 leading-relaxed">
            Ce n&apos;est <strong>pas une économie</strong> sur le chantier : vous payez le solde
            plus tard (
            {formatEuro(diff)}
            {" "}
            reportés). L&apos;intérêt est de ne pas bloquer trop
            d&apos;argent avant le début des travaux.
          </p>
        </div>
      </div>
    </div>
  );
}
