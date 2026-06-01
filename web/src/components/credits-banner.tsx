import { Sparkles } from "lucide-react";

export function CreditsBanner({ balance }: { balance: number }) {
  if (balance <= 0) return null;

  return (
    <div className="mb-8 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-950">
      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
      <p className="text-sm">
        <strong>
          {balance} rapport{balance > 1 ? "s" : ""} complet{balance > 1 ? "s" : ""}
        </strong>{" "}
        disponible{balance > 1 ? "s" : ""} sur cet appareil (pack acheté). La prochaine
        analyse sera débloquée automatiquement.
      </p>
    </div>
  );
}
