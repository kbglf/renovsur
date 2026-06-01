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
import {
  BENCHMARKS,
  detectWorkType,
  getRegionalPrice,
} from "./price-benchmarks";

function parseLinesFromText(text: string): QuoteLine[] {
  const lines: QuoteLine[] = [];
  const rowPattern =
    /^(.{5,80}?)\s+(\d+(?:[.,]\d+)?)\s*(?:€|eur)?\s*$/gim;

  let match;
  while ((match = rowPattern.exec(text)) !== null) {
    const total = parseFloat(match[2].replace(",", "."));
    if (!isNaN(total) && total > 0) {
      lines.push({ description: match[1].trim(), total });
    }
  }

  if (lines.length === 0) {
    const chunks = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && /\d/.test(l));
    for (const chunk of chunks.slice(0, 8)) {
      const priceMatch = chunk.match(/(\d[\d\s.,]*)\s*€/);
      if (priceMatch) {
        const total = parseFloat(priceMatch[1].replace(/\s/g, "").replace(",", "."));
        lines.push({
          description: chunk.replace(priceMatch[0], "").trim() || chunk,
          total,
        });
      }
    }
  }

  return lines;
}

function extractTotal(text: string, lines: QuoteLine[]): number {
  const totalMatch = text.match(
    /total\s+(?:ttc|g[ée]n[ée]ral)?\s*[:\s]*(\d[\d\s.,]*)\s*€/i,
  );
  if (totalMatch) {
    return parseFloat(totalMatch[1].replace(/\s/g, "").replace(",", "."));
  }
  if (lines.length > 0) {
    return lines.reduce((s, l) => s + (l.total ?? 0), 0);
  }
  const anyPrice = text.match(/(\d[\d\s.,]{2,})\s*€/g);
  if (anyPrice?.length) {
    const nums = anyPrice.map((p) =>
      parseFloat(p.replace(/[^\d.,]/g, "").replace(",", ".")),
    );
    return Math.max(...nums);
  }
  return 0;
}

function extractSiret(text: string): string | undefined {
  const match = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/);
  return match?.[1].replace(/\s/g, "");
}

function extractDepositPercent(text: string): number | undefined {
  const match = text.match(/acompte.{0,40}(\d+)\s*%/i);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return n > 0 && n <= 100 ? n : undefined;
}

/** Afficher une marge € seulement si elle est significative */
export function isMeaningfulSavings(savings: number, totalAmount: number): boolean {
  if (savings <= 0 || totalAmount <= 0) return false;
  return savings >= Math.max(100, Math.round(totalAmount * 0.05));
}

/** Surface en m² dans une ligne ou le devis (ex. « 35 m² ») */
function extractSurfaceM2(text: string): number | undefined {
  const match = text.match(/(\d+(?:[.,]\d+)?)\s*m[²2]\b/i);
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

/** Somme des économies, plafonnée au montant TTC du devis */
export function computeTotalSavingsEstimate(
  alerts: Alert[],
  totalAmount: number,
): number {
  if (totalAmount <= 0) return 0;
  const raw = alerts.reduce((sum, a) => sum + (a.savingsEstimate ?? 0), 0);
  return Math.min(Math.round(raw), totalAmount);
}

function buildPriceComparisons(input: QuoteInput): PriceComparison[] {
  const workType = input.workType || detectWorkType(input.quoteText);
  const benchmark = BENCHMARKS[workType];
  const marketPrice = getRegionalPrice(benchmark.basePrice, input.region);
  const comparisons: PriceComparison[] = [];

  if (input.surfaceM2 && input.surfaceM2 > 0) {
    const pricePerM2 = input.totalAmount / input.surfaceM2;
    const deviation = ((pricePerM2 - marketPrice) / marketPrice) * 100;
    comparisons.push({
      item: `${benchmark.label} (${input.surfaceM2} m²)`,
      yourPrice: Math.round(pricePerM2),
      marketAverage: marketPrice,
      deviationPercent: Math.round(deviation),
      status:
        deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
    });
  }

  for (const line of input.lines.slice(0, 6)) {
    if (!line.total || line.total <= 0) continue;
    const estimatedMarket = estimateLineMarketTotal(line, input.region);
    if (estimatedMarket === null || estimatedMarket <= 0) continue;

    const deviation =
      ((line.total - estimatedMarket) / estimatedMarket) * 100;
    if (Math.abs(deviation) > 15) {
      comparisons.push({
        item: line.description.slice(0, 60),
        yourPrice: line.total,
        marketAverage: estimatedMarket,
        deviationPercent: Math.round(deviation),
        status:
          deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
      });
    }
  }

  if (comparisons.length === 0 && input.totalAmount > 0) {
    const surface =
      input.surfaceM2 ?? extractSurfaceM2(input.quoteText) ?? 20;
    const estimatedMarket = getRegionalPrice(
      benchmark.basePrice * surface,
      input.region,
    );
    const deviation =
      ((input.totalAmount - estimatedMarket) / estimatedMarket) * 100;
    comparisons.push({
      item: `Estimation globale — ${benchmark.label}`,
      yourPrice: input.totalAmount,
      marketAverage: estimatedMarket,
      deviationPercent: Math.round(deviation),
      status:
        deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
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
      description: `Vous payez ${c.yourPrice.toLocaleString("fr-FR")} € vs ${c.marketAverage.toLocaleString("fr-FR")} € en moyenne (+${c.deviationPercent}%).`,
      recommendation:
        "Demandez une justification écrite ou un devis concurrent pour négocier à la baisse.",
      savingsEstimate: Math.min(
        Math.max(0, c.yourPrice - c.marketAverage),
        c.yourPrice,
      ),
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
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Devis fiable";
  if (score >= 60) return "Points de vigilance";
  if (score >= 40) return "Risque modéré";
  return "Alerte rouge — ne signez pas";
}

function buildSummary(score: number, alerts: Alert[], total: number): string {
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const savings = computeTotalSavingsEstimate(alerts, total);
  const amount = total.toLocaleString("fr-FR");

  if (score >= 80) {
    return `Ce devis de ${amount} € présente un profil globalement sain. Quelques vérifications restent recommandées avant signature.`;
  }

  if (score < 40) {
    const savingsLine = isMeaningfulSavings(savings, total)
      ? ` Des leviers financiers estimés à ${savings.toLocaleString("fr-FR")} € restent possibles après correction des points bloquants.`
      : "";
    return (
      `Devis de ${amount} € : ${critical} point(s) critique(s) et ${warning} point(s) de vigilance — le score reflète surtout des risques (conformité, entreprise, paiement), pas seulement le prix.${savingsLine}`
    );
  }

  if (critical > 0 || warning > 0) {
    const savingsLine = isMeaningfulSavings(savings, total)
      ? ` Marge de négociation possible : jusqu'à ${savings.toLocaleString("fr-FR")} €.`
      : "";
    return `Ce devis de ${amount} € comporte ${critical} alerte(s) critique(s) et ${warning} point(s) de vigilance.${savingsLine}`;
  }

  return `Ce devis de ${amount} € mérite une relecture attentive avant signature.`;
}

export function analyzeQuote(raw: Partial<QuoteInput>): AnalysisResult {
  const quoteText = raw.quoteText?.trim() ?? "";
  const lines = raw.lines?.length
    ? raw.lines
    : parseLinesFromText(quoteText);
  const totalAmount = raw.totalAmount || extractTotal(quoteText, lines);
  const siret = raw.siret || extractSiret(quoteText);
  const surfaceM2 = raw.surfaceM2 ?? extractSurfaceM2(quoteText);

  const input: QuoteInput = {
    artisanName: raw.artisanName,
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

  const totalSavingsEstimate = computeTotalSavingsEstimate(
    allAlerts,
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
    summary: buildSummary(score, allAlerts, totalAmount),
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
