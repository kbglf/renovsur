import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { Alert } from "@/lib/types";
import { cn, formatEuro } from "@/lib/utils";

const ICONS = {
  critical: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const STYLES = {
  critical: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

export function AlertCard({ alert, blurred }: { alert: Alert; blurred?: boolean }) {
  const Icon = ICONS[alert.severity];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition",
        STYLES[alert.severity],
        blurred && "select-none blur-sm pointer-events-none",
      )}
    >
      <div className="flex gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold">{alert.title}</h3>
          <p className="mt-1 text-sm opacity-90">{alert.description}</p>
          <p className="mt-3 text-sm font-medium">
            → {alert.recommendation}
          </p>
          {alert.savingsEstimate && alert.savingsEstimate > 0 && (
            <p className="mt-2 text-sm text-emerald-800">
              <span className="font-semibold">
                Économie possible : {formatEuro(alert.savingsEstimate)}
              </span>
              {" "}
              (si négociation — pas un montant à payer en plus)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
