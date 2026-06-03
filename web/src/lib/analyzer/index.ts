import { randomUUID } from "crypto";
import type {
  Alert,
  AnalysisResult,
  QuoteInput,
} from "../types";
import { runLegalChecks, computeLegalScore, buildLegalAlerts } from "./legal-checks";
import { detectScamPatterns } from "./scam-patterns";
import {
  buildNegotiationLetter,
  generateNegotiationAdvice,
} from "./negotiation-letter";
import {
  buildPriceComparisons,
  buildPriceAlerts,
} from "./price-analysis";
import { detectWorkType } from "./price-benchmarks";
import {
  extractDepositPercent,
  extractFirstSiret,
  extractTotalFromText,
  parseLinesFromText,
} from "../quote-parse";
import {
  computeSavingsFromComparisons,
} from "../price-savings";

function extractArtisanName(text: string): string | undefined {
  const line = text.split("\n").find((l) => {
    const t = l.trim();
    return (
      t.length >= 5 &&
      t.length <= 100 &&
      !/^devis|total|tva|acompte|validit/i.test(t)
    );
  });
  return line?.trim();
}

export { isMeaningfulSavings } from "../price-savings";
export { buildPriceComparisons, buildPriceAlerts } from "./price-analysis";

/** Surface en m² dans une ligne ou le devis (ex. « 35 m² ») */
function extractSurfaceM2(text: string): number | undefined {
  // \b ne matche pas après « ² » (U+00B2) — les devis utilisent souvent m² en typographie française
  const match = text.match(
    /(\d+(?:[.,]\d+)?)\s*m(?:²|2)(?=\s|$|—|[^0-9a-zA-Z_])/i,
  );
  if (!match) return undefined;
  const n = parseFloat(match[1].replace(",", "."));
  return n > 0 && n < 10_000 ? n : undefined;
}

/** @deprecated Préférer computeSavingsFromComparisons */
export function computeTotalSavingsEstimate(
  alerts: Alert[],
  totalAmount: number,
): number {
  if (totalAmount <= 0) return 0;
  const raw = alerts
    .filter((a) => a.id.startsWith("price-"))
    .reduce((sum, a) => sum + (a.savingsEstimate ?? 0), 0);
  return Math.min(Math.round(raw), totalAmount);
}

export function refreshPriceAnalysis(report: AnalysisResult): void {
  const priceComparisons = buildPriceComparisons(report.input);
  const priceAlerts = buildPriceAlerts(priceComparisons);
  report.priceComparisons = priceComparisons;
  report.alerts = [
    ...report.alerts.filter((a) => !a.id.startsWith("price-")),
    ...priceAlerts,
  ].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
  report.totalSavingsEstimate = computeSavingsFromComparisons(
    priceComparisons,
    report.input.totalAmount,
  );
}

function computeGlobalScore(
  legalScore: number,
  alerts: Alert[],
  comparisons: AnalysisResult["priceComparisons"],
): number {
  let score = legalScore * 0.5;
  const priceOk = comparisons.filter((c) => c.status === "ok").length;
  const priceTotal = comparisons.length || 1;
  score += (priceOk / priceTotal) * 30;
  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;
  score -= criticalCount * 12;
  score -= warningCount * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function refreshReportScore(report: AnalysisResult): void {
  const legalChecksWithWeight = report.legalChecks.map((c) => ({
    ...c,
    weight: 10,
  }));
  const legalScore = computeLegalScore(legalChecksWithWeight);
  report.score = computeGlobalScore(
    legalScore,
    report.alerts,
    report.priceComparisons,
  );
  report.scoreLabel = scoreLabel(report.score);
  report.summary = buildSummary(
    report.score,
    report.alerts,
    report.input.totalAmount,
    report.totalSavingsEstimate,
  );
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Devis fiable";
  if (score >= 60) return "Points de vigilance";
  if (score >= 40) return "Risque modéré";
  return "Alerte rouge — ne signez pas";
}

function buildSummary(
  score: number,
  alerts: Alert[],
  total: number,
  priceSavings: number,
): string {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const amount = total.toLocaleString("fr-FR");
  const savingsLine =
    priceSavings > 0
      ? ` Marge de négociation sur les postes comparés : jusqu'à ${priceSavings.toLocaleString("fr-FR")} € (voir détail plus bas).`
      : "";

  if (score >= 80) {
    return `Ce devis de ${amount} € présente un profil globalement sain. Quelques vérifications restent recommandées avant signature.${savingsLine}`;
  }

  if (score < 40) {
    return (
      `Devis de ${amount} € : ${critical} point(s) critique(s) et ${warning} point(s) de vigilance. ` +
      `Priorité : corriger les risques (entreprise, conformité, paiement) avant de signer.${savingsLine}`
    );
  }

  if (critical > 0 || warning > 0) {
    return `Ce devis de ${amount} € comporte ${critical} alerte(s) critique(s) et ${warning} point(s) de vigilance.${savingsLine}`;
  }

  return `Ce devis de ${amount} € mérite une relecture attentive avant signature.${savingsLine}`;
}

export function analyzeQuote(raw: Partial<QuoteInput>): AnalysisResult {
  const quoteText = raw.quoteText?.trim() ?? "";
  const lines = raw.lines?.length
    ? raw.lines
    : parseLinesFromText(quoteText);
  const totalAmount = raw.totalAmount || extractTotalFromText(quoteText, lines);
  const extractedSiret = extractFirstSiret(quoteText);
  const siret = raw.siret ?? raw.providerSiret ?? extractedSiret;

  const input: QuoteInput = {
    artisanName:
      raw.artisanName?.trim() ||
      extractArtisanName(quoteText),
    siret,
    providerSiret: raw.providerSiret,
    clientSiret: raw.clientSiret,
    quoteText,
    lines,
    totalAmount,
    workType: raw.workType || detectWorkType(quoteText),
    surfaceM2: raw.surfaceM2 ?? extractSurfaceM2(quoteText),
    region: raw.region || "autre",
    hasDecennale: raw.hasDecennale,
    validityDays: raw.validityDays,
    depositPercent: raw.depositPercent ?? extractDepositPercent(quoteText),
    email: raw.email,
  };

  const legalChecks = runLegalChecks(input);
  const legalScore = computeLegalScore(legalChecks);
  const scamAlerts = detectScamPatterns(input);
  const priceComparisons = buildPriceComparisons(input);
  const priceAlerts = buildPriceAlerts(priceComparisons);
  const legalAlerts = buildLegalAlerts(
    legalChecks,
    new Set([...scamAlerts, ...priceAlerts].map((a) => a.id)),
  );
  const allAlerts = [...scamAlerts, ...priceAlerts, ...legalAlerts].sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const score = computeGlobalScore(legalScore, allAlerts, priceComparisons);

  const totalSavingsEstimate = computeSavingsFromComparisons(
    priceComparisons,
    totalAmount,
  );

  const legalChecksMapped = legalChecks.map(({ label, passed, detail }) => ({
    label,
    passed,
    detail,
  }));

  const negotiationAdvice = generateNegotiationAdvice(input, allAlerts);

  const draftForLetter: AnalysisResult = {
    id: "",
    createdAt: new Date().toISOString(),
    score,
    scoreLabel: scoreLabel(score),
    summary: "",
    alerts: allAlerts,
    priceComparisons,
    legalChecks: legalChecksMapped,
    negotiationAdvice,
    negotiationLetter: "",
    totalSavingsEstimate,
    isPaid: false,
    plan: "free",
    input,
  };
  const negotiationLetter = buildNegotiationLetter(draftForLetter);

  return {
    id: randomUUID(),
    createdAt: draftForLetter.createdAt,
    score,
    scoreLabel: scoreLabel(score),
    summary: buildSummary(score, allAlerts, totalAmount, totalSavingsEstimate),
    alerts: allAlerts,
    priceComparisons,
    legalChecks: legalChecksMapped,
    negotiationAdvice,
    negotiationLetter,
    totalSavingsEstimate,
    isPaid: false,
    plan: "free",
    input,
    email: raw.email?.trim().toLowerCase(),
  };
}

/** @deprecated Utiliser toFreePreview depuis @/lib/free-tier */
export { toFreePreview as maskForFreePlan } from "../free-tier";
