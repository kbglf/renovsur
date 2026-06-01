import Link from "next/link";
import { Building2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import type { SiretVerification } from "@/lib/siret-verify";

function formatSiret(siret: string): string {
  const d = siret.replace(/\D/g, "");
  if (d.length !== 14) return siret;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

const STATUS_UI: Record<
  SiretVerification["status"],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  active: {
    label: "Entreprise active",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    Icon: CheckCircle2,
  },
  closed: {
    label: "Établissement fermé",
    className: "border-red-200 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  not_found: {
    label: "Introuvable au registre",
    className: "border-red-200 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  invalid: {
    label: "Numéro invalide",
    className: "border-red-200 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  unavailable: {
    label: "Vérification indisponible",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    Icon: AlertTriangle,
  },
};

export function SiretVerificationCard({
  verification,
  compact,
}: {
  verification: SiretVerification;
  compact?: boolean;
}) {
  const ui = STATUS_UI[verification.status];
  const Icon = ui.Icon;

  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${ui.className}`}
      aria-label="Vérification SIRET"
    >
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">Vérification SIRET</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold">
              <Icon className="h-3.5 w-3.5" />
              {ui.label}
            </span>
          </div>
          <p className="mt-1 font-mono text-sm opacity-90">{formatSiret(verification.siret)}</p>
          <p className="mt-3 text-sm leading-relaxed">{verification.summary}</p>

          {!compact && verification.companyName && (
            <p className="mt-2 text-sm">
              <strong>Raison sociale :</strong> {verification.companyName}
            </p>
          )}
          {!compact && verification.address && (
            <p className="mt-1 text-sm">
              <strong>Adresse :</strong> {verification.address}
            </p>
          )}
          {!compact && verification.activityCode && (
            <p className="mt-1 text-sm">
              <strong>Code NAF :</strong> {verification.activityCode}
            </p>
          )}

          <p className="mt-3 text-xs opacity-75">
            Source : registre national (API Recherche d&apos;entreprises — data.gouv.fr), le{" "}
            {new Date(verification.verifiedAt).toLocaleString("fr-FR")}.
          </p>

          {verification.registryUrl && (
            <Link
              href={verification.registryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2"
            >
              Voir la fiche officielle
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
