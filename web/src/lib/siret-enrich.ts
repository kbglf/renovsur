import type { Alert, AnalysisResult } from "./types";
import type { CompanyRegistryBundle } from "./registry-verify";
import { refreshReportScore } from "./analyzer";

function formatSiretDisplay(siret: string): string {
  return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}

/** Enrichit le rapport avec SIRET, RGE (registre) et décennale (analyse devis) */
export function applyCompanyRegistryVerification(
  report: AnalysisResult,
  bundle: CompanyRegistryBundle,
): void {
  const { siret, rge, decennale } = bundle;

  report.siretVerification = siret;
  report.rgeVerification = rge;
  report.decennaleVerification = decennale;

  updateLegalCheck(report, "SIRET", (check) => {
    switch (siret.status) {
      case "active":
        check.passed = true;
        check.detail = [
          `SIRET ${formatSiretDisplay(siret.siret)} confirmé au registre national.`,
          siret.companyName,
          siret.address,
        ]
          .filter(Boolean)
          .join(" — ");
        break;
      case "closed":
      case "not_found":
      case "invalid":
        check.passed = false;
        check.detail = siret.summary;
        break;
      case "unavailable":
        check.detail = `${check.detail} ${siret.summary}`;
        break;
    }
  });

  updateLegalCheck(report, "RGE", (check) => {
    if (!rge.required) {
      check.passed = true;
      check.detail = rge.summary;
      return;
    }
    check.passed = rge.status === "certified";
    check.detail = rge.summary;
  });

  updateLegalCheck(report, "décennale", (check) => {
    if (!decennale.required) {
      check.passed = true;
      check.detail = decennale.summary;
      return;
    }
    check.passed = decennale.status === "mentioned";
    check.detail = decennale.summary;
  });

  const alerts = [
    buildSiretAlert(siret),
    buildRgeAlert(rge),
    buildDecennaleAlert(decennale),
  ].filter(Boolean) as Alert[];

  if (alerts.length > 0) {
    const ids = new Set(alerts.map((a) => a.id));
    report.alerts = report.alerts.filter((a) => !ids.has(a.id));
    report.alerts.unshift(...alerts);
    refreshReportScore(report);
  }
}

/** @deprecated Utiliser applyCompanyRegistryVerification */
export function applySiretVerification(
  report: AnalysisResult,
  verification: CompanyRegistryBundle["siret"],
): void {
  applyCompanyRegistryVerification(report, {
    siret: verification,
    rge: {
      required: false,
      status: "not_required",
      certificationCodes: [],
      summary: "",
      annuaireUrl: "https://france-renov.gouv.fr/annuaire-professionnels",
    },
    decennale: {
      required: false,
      status: "not_required",
      mentionedInQuote: false,
      summary: "",
      guideUrl: "https://www.service-public.fr/particuliers/vosdroits/F35741",
    },
  });
}

function updateLegalCheck(
  report: AnalysisResult,
  labelPart: string,
  update: (check: AnalysisResult["legalChecks"][number]) => void,
): void {
  const check = report.legalChecks.find((c) =>
    c.label.toLowerCase().includes(labelPart.toLowerCase()),
  );
  if (check) update(check);
}

function buildSiretAlert(siret: CompanyRegistryBundle["siret"]): Alert | null {
  switch (siret.status) {
    case "active":
      return {
        id: "siret-registry",
        severity: "info",
        title: "SIRET vérifié — entreprise active",
        description: siret.summary,
        recommendation:
          "Consultez la fiche officielle sur annuaire-entreprises.data.gouv.fr avant signature.",
      };
    case "closed":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "SIRET — établissement fermé ou radié",
        description: siret.summary,
        recommendation:
          "Ne signez pas sans vérifier. Demandez un devis au nom d'une entreprise active.",
      };
    case "not_found":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "SIRET introuvable au registre national",
        description: siret.summary,
        recommendation:
          "Exigez un SIRET valide et vérifiez-le sur annuaire-entreprises.data.gouv.fr avant tout paiement.",
      };
    case "invalid":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "Numéro SIRET invalide",
        description: siret.summary,
        recommendation:
          "Un SIRET valide comporte 14 chiffres avec une clé de contrôle correcte.",
      };
    default:
      return null;
  }
}

function buildRgeAlert(rge: CompanyRegistryBundle["rge"]): Alert | null {
  if (!rge.required) return null;

  if (rge.status === "certified") {
    return {
      id: "rge-registry",
      severity: "info",
      title: "Label RGE confirmé au registre national",
      description: rge.summary,
      recommendation:
        "Vérifiez que les qualifications RGE couvrent bien les travaux prévus (isolation, PAC, etc.).",
    };
  }

  if (rge.status === "not_certified") {
    return {
      id: "rge-registry",
      severity: "warning",
      title: "Aucun label RGE au registre national",
      description: rge.summary,
      recommendation:
        "Pour MaPrimeRénov' ou les CEE, choisissez un artisan RGE via l'annuaire France Rénov'.",
    };
  }

  return null;
}

function buildDecennaleAlert(
  decennale: CompanyRegistryBundle["decennale"],
): Alert | null {
  if (!decennale.required) return null;

  if (decennale.status === "missing") {
    return {
      id: "decennale-check",
      severity: "critical",
      title: "Assurance décennale absente du devis",
      description: decennale.summary,
      recommendation:
        "Exigez une attestation décennale en cours de validité, avec numéro de police et activités couvertes, avant tout acompte.",
    };
  }

  if (decennale.status === "mentioned") {
    return {
      id: "decennale-check",
      severity: "warning",
      title: "Décennale mentionnée — à confirmer auprès de l'assureur",
      description: decennale.summary,
      recommendation:
        "Appelez l'assureur indiqué avec le numéro de contrat pour confirmer que la police est active et couvre vos travaux.",
    };
  }

  return null;
}
