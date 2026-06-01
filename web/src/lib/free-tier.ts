import type { Alert, AlertSeverity, AnalysisResult } from "./types";

export type AlertCounts = {
  critical: number;
  warning: number;
  info: number;
  total: number;
};

export function countAlerts(alerts: Alert[]): AlertCounts {
  return {
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
    total: alerts.length,
  };
}

export function computeLegalPercent(
  checks: AnalysisResult["legalChecks"],
): number {
  if (checks.length === 0) return 0;
  const passed = checks.filter((c) => c.passed).length;
  return Math.round((passed / checks.length) * 100);
}

/** Aperçu gratuit strict : score + compteurs, aucun détail exploitable */
export function toFreePreview(full: AnalysisResult): AnalysisResult {
  const counts = countAlerts(full.alerts);
  const legalPercent = computeLegalPercent(full.legalChecks);

  const teaserAlerts: Alert[] = [];
  const order: AlertSeverity[] = ["critical", "warning", "info"];
  let idx = 0;
  for (const severity of order) {
    const n =
      severity === "critical"
        ? counts.critical
        : severity === "warning"
          ? counts.warning
          : counts.info;
    for (let i = 0; i < Math.min(n, 3 - teaserAlerts.length); i++) {
      teaserAlerts.push({
        id: `locked-${idx++}`,
        severity,
        title:
          severity === "critical"
            ? "Alerte critique détectée"
            : severity === "warning"
              ? "Point de vigilance détecté"
              : "Information importante",
        description:
          "Le détail de cette alerte est réservé au rapport complet.",
        recommendation:
          "Débloquez le rapport pour lire l'analyse et les actions recommandées.",
      });
      if (teaserAlerts.length >= 3) break;
    }
    if (teaserAlerts.length >= 3) break;
  }

  return {
    ...full,
    summary: buildTeaserSummary(full, counts, legalPercent),
    alerts: teaserAlerts,
    priceComparisons: [],
    legalChecks: full.legalChecks.map((c) => ({
      label: c.passed ? "Point conforme" : "Point à vérifier",
      passed: c.passed,
      detail: c.label.includes("SIRET") || c.label.includes("RGE") || c.label.includes("décennale")
        ? c.detail
        : "Détail disponible dans le rapport complet.",
    })),
    negotiationAdvice: [],
    negotiationLetter: "",
    totalSavingsEstimate: 0,
    isPaid: false,
    plan: "free",
    siretVerification: full.siretVerification,
    rgeVerification: full.rgeVerification,
    decennaleVerification: full.decennaleVerification,
    input: {
      ...full.input,
      quoteText: buildQuotePreviewText(full.input.quoteText),
    },
  };
}

/** Aperçu lisible : l'utilisateur voit de quel devis il s'agit */
function buildQuotePreviewText(text: string): string {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "[Devis non lisible — relancez l'analyse]";
  const head = lines.slice(0, 10).join("\n");
  if (lines.length > 10 || text.length > 900) {
    return `${head}\n\n[… fin du devis : rapport complet pour le texte intégral]`;
  }
  return head;
}

function buildTeaserSummary(
  full: AnalysisResult,
  counts: AlertCounts,
  legalPercent: number,
): string {
  const amount =
    full.input.totalAmount > 0
      ? ` (${full.input.totalAmount.toLocaleString("fr-FR")} € TTC)`
      : "";
  return (
    `Score ${full.score}/100 — ${counts.total} alerte(s) dont ${counts.critical} critique(s). ` +
    `Conformité légale estimée : ${legalPercent}%.` +
    `${amount} Le rapport complet détaille chaque point et les économies éventuelles (estimation).`
  );
}
