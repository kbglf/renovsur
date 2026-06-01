import { randomUUID } from "crypto";
import type {
  Alert,
  AnalysisResult,
  PriceComparison,
  QuoteInput,
  QuoteLine,
} from "../types";
import { runLegalChecks, computeLegalScore } from "./legal-checks";
import { detectScamPatterns, generateNegotiationPoints } from "./scam-patterns";
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
    const lineType = detectWorkType(line.description);
    const lineBenchmark = BENCHMARKS[lineType];
    const avg = getRegionalPrice(lineBenchmark.basePrice, input.region);
    const estimatedMarket =
      lineType === input.workType && input.surfaceM2
        ? avg * input.surfaceM2
        : avg;
    const deviation =
      ((line.total - estimatedMarket) / estimatedMarket) * 100;
    if (Math.abs(deviation) > 15) {
      comparisons.push({
        item: line.description.slice(0, 60),
        yourPrice: line.total,
        marketAverage: Math.round(estimatedMarket),
        deviationPercent: Math.round(deviation),
        status:
          deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
      });
    }
  }

  if (comparisons.length === 0 && input.totalAmount > 0) {
    const estimatedMarket = getRegionalPrice(
      benchmark.basePrice * (input.surfaceM2 || 20),
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
      savingsEstimate: Math.max(0, c.yourPrice - c.marketAverage),
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
  const savings = alerts.reduce((s, a) => s + (a.savingsEstimate ?? 0), 0);

  if (score >= 80) {
    return `Ce devis de ${total.toLocaleString("fr-FR")} € présente un profil globalement sain. Quelques vérifications restent recommandées avant signature.`;
  }
  if (critical > 0) {
    return `Attention : ${critical} alerte(s) critique(s) détectée(s) sur ce devis de ${total.toLocaleString("fr-FR")} €. Potentiel d'économie estimé : ${savings.toLocaleString("fr-FR")} €.`;
  }
  return `Ce devis de ${total.toLocaleString("fr-FR")} € mérite une analyse approfondie. Des écarts de prix et des manques légaux ont été identifiés.`;
}

export function analyzeQuote(raw: Partial<QuoteInput>): AnalysisResult {
  const quoteText = raw.quoteText?.trim() ?? "";
  const lines = raw.lines?.length
    ? raw.lines
    : parseLinesFromText(quoteText);
  const totalAmount = raw.totalAmount || extractTotal(quoteText, lines);
  const siret = raw.siret || extractSiret(quoteText);

  const input: QuoteInput = {
    artisanName: raw.artisanName,
    siret,
    quoteText,
    lines,
    totalAmount,
    workType: raw.workType || detectWorkType(quoteText),
    surfaceM2: raw.surfaceM2,
    region: raw.region || "autre",
    hasDecennale: raw.hasDecennale,
    validityDays: raw.validityDays,
    depositPercent: raw.depositPercent,
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
  const negotiationPoints = generateNegotiationPoints(input);

  const totalSavingsEstimate = allAlerts.reduce(
    (s, a) => s + (a.savingsEstimate ?? 0),
    0,
  );

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    score,
    scoreLabel: scoreLabel(score),
    summary: buildSummary(score, allAlerts, totalAmount),
    alerts: allAlerts,
    priceComparisons,
    legalChecks: legalChecks.map(({ label, passed, detail }) => ({
      label,
      passed,
      detail,
    })),
    negotiationPoints,
    totalSavingsEstimate,
    isPaid: false,
    plan: "free",
    input,
    email: raw.email?.trim().toLowerCase(),
  };
}

/** @deprecated Utiliser toFreePreview depuis @/lib/free-tier */
export { toFreePreview as maskForFreePlan } from "../free-tier";
