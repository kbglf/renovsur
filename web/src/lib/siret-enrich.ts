import type { Alert, AnalysisResult } from "./types";
import type { SiretVerification } from "./siret-verify";
import { refreshReportScore } from "./analyzer";

function formatSiretDisplay(siret: string): string {
  return siret.replace(/(\d{3})(\d{3})(\d{3})(\d{5})/, "$1 $2 $3 $4");
}

/** Enrichit le rapport avec la vérification SIRET officielle */
export function applySiretVerification(
  report: AnalysisResult,
  verification: SiretVerification,
): void {
  report.siretVerification = verification;

  const siretCheck = report.legalChecks.find((c) => c.label.includes("SIRET"));

  if (siretCheck) {
    switch (verification.status) {
      case "active":
        siretCheck.passed = true;
        siretCheck.detail = [
          `SIRET ${formatSiretDisplay(verification.siret)} confirmé au registre national (API data.gouv.fr).`,
          verification.companyName,
          verification.address,
        ]
          .filter(Boolean)
          .join(" — ");
        break;
      case "closed":
      case "not_found":
      case "invalid":
        siretCheck.passed = false;
        siretCheck.detail = verification.summary;
        break;
      case "unavailable":
        siretCheck.detail = `${siretCheck.detail} ${verification.summary}`;
        break;
    }
  }

  const alert = buildSiretAlert(verification);
  if (alert) {
    report.alerts = report.alerts.filter((a) => a.id !== "siret-registry");
    report.alerts.unshift(alert);
    refreshReportScore(report);
  }
}

function buildSiretAlert(verification: SiretVerification): Alert | null {
  switch (verification.status) {
    case "active":
      return {
        id: "siret-registry",
        severity: "info",
        title: "SIRET vérifié — entreprise active",
        description: verification.summary,
        recommendation:
          "Consultez la fiche officielle sur annuaire-entreprises.data.gouv.fr avant signature.",
      };
    case "closed":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "SIRET — établissement fermé ou radié",
        description: verification.summary,
        recommendation:
          "Ne signez pas sans vérifier. Demandez un devis au nom d'une entreprise active.",
      };
    case "not_found":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "SIRET introuvable au registre national",
        description: verification.summary,
        recommendation:
          "Exigez un SIRET valide et vérifiez-le sur annuaire-entreprises.data.gouv.fr avant tout paiement.",
      };
    case "invalid":
      return {
        id: "siret-registry",
        severity: "critical",
        title: "Numéro SIRET invalide",
        description: verification.summary,
        recommendation:
          "Un SIRET valide comporte 14 chiffres avec une clé de contrôle correcte.",
      };
    default:
      return null;
  }
}
