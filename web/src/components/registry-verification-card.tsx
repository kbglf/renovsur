import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Leaf,
  Shield,
} from "lucide-react";
import type {
  DecennaleVerification,
  RgeVerification,
  SiretVerification,
} from "@/lib/registry-verify";

function formatSiret(siret: string): string {
  const d = siret.replace(/\D/g, "");
  if (d.length !== 14) return siret;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
}

const SIRET_STATUS_UI: Record<
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

const RGE_STATUS_UI: Record<
  RgeVerification["status"],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  certified: {
    label: "RGE confirmé",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
    Icon: CheckCircle2,
  },
  not_certified: {
    label: "Non RGE",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    Icon: AlertTriangle,
  },
  not_required: {
    label: "Non requis",
    className: "border-slate-200 bg-slate-50 text-slate-800",
    Icon: CheckCircle2,
  },
  unknown: {
    label: "Non vérifiable",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    Icon: AlertTriangle,
  },
};

const DECENNALE_STATUS_UI: Record<
  DecennaleVerification["status"],
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  mentioned: {
    label: "Mention détectée",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    Icon: AlertTriangle,
  },
  missing: {
    label: "Absente du devis",
    className: "border-red-200 bg-red-50 text-red-950",
    Icon: XCircle,
  },
  not_required: {
    label: "Non requis",
    className: "border-slate-200 bg-slate-50 text-slate-800",
    Icon: CheckCircle2,
  },
  cannot_verify_online: {
    label: "À confirmer",
    className: "border-amber-200 bg-amber-50 text-amber-950",
    Icon: AlertTriangle,
  },
};

function VerificationBlock({
  title,
  icon: IconHeader,
  ui,
  summary,
  children,
  source,
  link,
}: {
  title: string;
  icon: typeof Building2;
  ui: { label: string; className: string; Icon: typeof CheckCircle2 };
  summary: string;
  children?: React.ReactNode;
  source?: string;
  link?: { href: string; label: string };
}) {
  const StatusIcon = ui.Icon;
  return (
    <section
      className={`rounded-2xl border p-5 sm:p-6 ${ui.className}`}
      aria-label={title}
    >
      <div className="flex items-start gap-3">
        <IconHeader className="mt-0.5 h-5 w-5 shrink-0 opacity-80" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold">{title}</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-semibold">
              <StatusIcon className="h-3.5 w-3.5" />
              {ui.label}
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed">{summary}</p>
          {children}
          {source && <p className="mt-3 text-xs opacity-75">{source}</p>}
          {link && (
            <Link
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold underline underline-offset-2"
            >
              {link.label}
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export function RegistryVerificationCards({
  siret,
  rge,
  decennale,
  compact,
}: {
  siret?: SiretVerification;
  rge?: RgeVerification;
  decennale?: DecennaleVerification;
  compact?: boolean;
}) {
  const showRge = rge && (rge.required || rge.certificationCodes.length > 0);
  const showDecennale = decennale && decennale.required;

  if (!siret && !showRge && !showDecennale) return null;

  return (
    <div className="space-y-4">
      {siret && (
        <VerificationBlock
          title="Vérification SIRET"
          icon={Building2}
          ui={SIRET_STATUS_UI[siret.status]}
          summary={siret.summary}
          source={`Source : registre national (API data.gouv.fr), le ${new Date(siret.verifiedAt).toLocaleString("fr-FR")}.`}
          link={
            siret.registryUrl
              ? { href: siret.registryUrl, label: "Voir la fiche officielle" }
              : undefined
          }
        >
          {!compact && siret.companyName && (
            <p className="mt-2 text-sm">
              <strong>Raison sociale :</strong> {siret.companyName}
            </p>
          )}
          {!compact && siret.address && (
            <p className="mt-1 text-sm">
              <strong>Adresse :</strong> {siret.address}
            </p>
          )}
          {!compact && siret.activityCode && (
            <p className="mt-1 text-sm">
              <strong>Code NAF :</strong> {siret.activityCode}
            </p>
          )}
          <p className="mt-2 font-mono text-sm opacity-90">{formatSiret(siret.siret)}</p>
        </VerificationBlock>
      )}

      {showRge && rge && (
        <VerificationBlock
          title="Label RGE (rénovation énergétique)"
          icon={Leaf}
          ui={RGE_STATUS_UI[rge.status]}
          summary={rge.summary}
          source="Source : registre national des entreprises RGE (API Recherche d'entreprises — data.gouv.fr)."
          link={{ href: rge.annuaireUrl, label: "Annuaire France Rénov'" }}
        >
          {rge.certificationCodes.length > 0 && (
            <p className="mt-2 text-sm">
              <strong>Certifications :</strong> {rge.certificationCodes.join(", ")}
            </p>
          )}
        </VerificationBlock>
      )}

      {showDecennale && decennale && (
        <VerificationBlock
          title="Assurance décennale"
          icon={Shield}
          ui={DECENNALE_STATUS_UI[decennale.status]}
          summary={decennale.summary}
          source="Analyse automatique du texte du devis — aucune API publique ne permet de vérifier en ligne la validité d'une police d'assurance."
          link={{ href: decennale.guideUrl, label: "Guide Service-Public" }}
        >
          {!compact && decennale.policyNumber && (
            <p className="mt-2 text-sm">
              <strong>Référence détectée :</strong> {decennale.policyNumber}
            </p>
          )}
          {!compact && decennale.insurerHint && (
            <p className="mt-1 text-sm">
              <strong>Assureur mentionné :</strong> {decennale.insurerHint}
            </p>
          )}
        </VerificationBlock>
      )}
    </div>
  );
}

/** @deprecated Utiliser RegistryVerificationCards */
export function SiretVerificationCard({
  verification,
  compact,
}: {
  verification: SiretVerification;
  compact?: boolean;
}) {
  return <RegistryVerificationCards siret={verification} compact={compact} />;
}
