import { randomUUID } from "crypto";
import type {
  Alert,
  AnalysisResult,
  PriceComparison,
  QuoteInput,
  QuoteLine,
} from "../types";
import { runLegalChecks, computeLegalScore } from "./legal-checks";
import { detectScamPatterns } from "./scam-patterns";
import {
  buildNegotiationLetter,
  generateNegotiationAdvice,
} from "./negotiation-letter";
import { formatEuro } from "../utils";
import {
  BENCHMARKS,
  REGION_LABELS,
  detectWorkType,
  getRegionalPrice,
} from "./price-benchmarks";
import { extractTotalFromText, parseLinesFromText } from "../quote-parse";
import {
  computeSavingsFromComparisons,
  savingsFromComparison,
} from "../price-savings";

function extractSiret(text: string): string | undefined {
  const match = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/);
  return match?.[1].replace(/\s/g, "");
}

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

function extractDepositPercent(text: string): number | undefined {
  const match = text.match(/acompte.{0,40}(\d+)\s*%/i);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return n > 0 && n <= 100 ? n : undefined;
}

export { isMeaningfulSavings } from "../price-savings";

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

/**
 * Estime un prix marché pour une ligne (uniquement si unité m² + quantité connue).
 * Évite de comparer 980 € total à 28 €/m² sans surface — source du bug « économies > devis ».
 */
function estimateLineMarketTotal(
  line: QuoteLine,
  region: QuoteInput["region"],
): number | null {
  const lineType = detectWorkType(line.description);
  const bench = BENCHMARKS[lineType];
  if (bench.unit !== "m²") return null;

  const qty =
    line.quantity ??
    extractSurfaceM2(line.description) ??
    (line.unit?.toLowerCase().includes("m") ? line.quantity : undefined);
  if (!qty || qty <= 0) return null;

  const unitPrice = getRegionalPrice(bench.basePrice, region);
  return Math.round(unitPrice * qty);
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

function buildPriceComparisons(input: QuoteInput): PriceComparison[] {
  const regionLabel = REGION_LABELS[input.region];
  const comparisons: PriceComparison[] = [];

  for (const line of input.lines.slice(0, 8)) {
    if (!line.total || line.total <= 0) continue;
    const qty = line.quantity ?? extractSurfaceM2(line.description);
    const lineType = detectWorkType(line.description);
    const lineBench = BENCHMARKS[lineType];

    if (lineBench.unit !== "m²" || !qty || qty <= 0) continue;

    const marketUnitLine = getRegionalPrice(lineBench.basePrice, input.region);
    const marketTotal = Math.round(marketUnitLine * qty);
    const yourPerM2 = Math.round(line.total / qty);
    const deviation = ((line.total - marketTotal) / marketTotal) * 100;

    if (Math.abs(deviation) <= 15) continue;

    comparisons.push({
      item: line.description.slice(0, 80),
      yourPrice: line.total,
      marketAverage: marketTotal,
      deviationPercent: Math.round(deviation),
      status:
        deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
      scope: "line_total",
      unit: "m²",
      quantity: qty,
      yourUnitPrice: yourPerM2,
      marketUnitPrice: marketUnitLine,
      explanation:
        `Sur votre devis : ${formatEuro(line.total)} pour ${qty} m², soit environ ${yourPerM2} €/m². ` +
        `Repère indicatif (${regionLabel}) : ~${lineBench.basePrice} €/m² national → ${marketUnitLine} €/m² × ${qty} m² ≈ ${formatEuro(marketTotal)}. ` +
        `Écart sur ce poste : ${deviation > 0 ? "+" : ""}${Math.round(deviation)} %.`,
    });
  }

  return comparisons;
}

function buildPriceAlerts(comparisons: PriceComparison[]): Alert[] {
  return comparisons
    .filter((c) => c.status !== "ok")
    .map((c, i) => ({
      id: `price-${i}`,
      severity: c.status === "very_high" ? ("critical" as const) : ("warning" as const),
      title:
        c.status === "very_high"
          ? `Prix très élevé : ${c.item}`
          : `Prix au-dessus du marché : ${c.item}`,
      description:
        c.explanation ??
        `Écart estimé de ${c.deviationPercent > 0 ? "+" : ""}${c.deviationPercent} % sur ce poste.`,
      recommendation:
        "Demandez une justification écrite ou un devis concurrent pour négocier à la baisse.",
      savingsEstimate: savingsFromComparison(c),
    }));
}

function computeGlobalScore(
  legalScore: number,
  alerts: Alert[],
  comparisons: PriceComparison[],
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
  const siret = raw.siret || extractSiret(quoteText);
  const surfaceM2 = raw.surfaceM2 ?? extractSurfaceM2(quoteText);

  const input: QuoteInput = {
    artisanName:
      raw.artisanName?.trim() ||
      extractArtisanName(quoteText),
    siret,
    quoteText,
    lines,
    totalAmount,
    workType: raw.workType || detectWorkType(quoteText),
    surfaceM2,
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
  const allAlerts = [...scamAlerts, ...priceAlerts].sort((a, b) => {
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
