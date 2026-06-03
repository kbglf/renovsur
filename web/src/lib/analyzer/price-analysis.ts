import type { Alert, PriceComparison, QuoteInput, QuoteLine } from "../types";
import { formatEuro } from "../utils";
import {
  BENCHMARKS,
  REGION_LABELS,
  detectWorkType,
  getRegionalPrice,
} from "./price-benchmarks";
import {
  detectPieceBenchmark,
  isPieceUnit,
  marketPieceUnitPrice,
} from "./piece-benchmarks";
import { savingsFromComparison } from "../price-savings";

function extractSurfaceM2(text: string): number | undefined {
  const match = text.match(
    /(\d+(?:[.,]\d+)?)\s*m(?:²|2)(?=\s|$|—|[^0-9a-zA-Z_])/i,
  );
  if (!match) return undefined;
  const n = parseFloat(match[1].replace(",", "."));
  return n > 0 && n < 10_000 ? n : undefined;
}

function compareLine(
  line: QuoteLine,
  input: QuoteInput,
  regionLabel: string,
): PriceComparison | null {
  if (!line.total || line.total <= 0) return null;

  const pieceBench = detectPieceBenchmark(line.description);
  const unitIsPiece =
    isPieceUnit(line.unit) ||
    (!line.unit && pieceBench !== null && (line.quantity ?? 0) > 0);

  if (pieceBench && unitIsPiece) {
    const qty = line.quantity ?? 1;
    const marketUnit = marketPieceUnitPrice(pieceBench, input.region);
    const marketTotal = Math.round(marketUnit * qty);
    const yourUnit = line.unitPrice ?? Math.round(line.total / qty);
    const deviation = ((line.total - marketTotal) / marketTotal) * 100;
    if (Math.abs(deviation) <= 15) return null;

    return {
      item: line.description.slice(0, 80),
      yourPrice: line.total,
      marketAverage: marketTotal,
      deviationPercent: Math.round(deviation),
      status: deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
      scope: "line_total",
      unit: "pce",
      quantity: qty,
      yourUnitPrice: yourUnit,
      marketUnitPrice: marketUnit,
      explanation:
        `Sur votre devis : ${formatEuro(line.total)} pour ${qty} × ${pieceBench.label.toLowerCase()}, soit ~${yourUnit} €/pièce. ` +
        `Repère indicatif (${regionLabel}) : ~${pieceBench.baseUnitPrice} €/pièce → ${marketUnit} €/pièce × ${qty} ≈ ${formatEuro(marketTotal)}. ` +
        `Écart : ${deviation > 0 ? "+" : ""}${Math.round(deviation)} %.`,
    };
  }

  const qty = line.quantity ?? extractSurfaceM2(line.description);
  const lineType = detectWorkType(line.description);
  const lineBench = BENCHMARKS[lineType];

  if (lineBench.unit !== "m²" || !qty || qty <= 0) return null;

  const marketUnitLine = getRegionalPrice(lineBench.basePrice, input.region);
  const marketTotal = Math.round(marketUnitLine * qty);
  const yourPerM2 = Math.round(line.total / qty);
  const deviation = ((line.total - marketTotal) / marketTotal) * 100;

  if (Math.abs(deviation) <= 15) return null;

  return {
    item: line.description.slice(0, 80),
    yourPrice: line.total,
    marketAverage: marketTotal,
    deviationPercent: Math.round(deviation),
    status: deviation > 40 ? "very_high" : deviation > 20 ? "high" : "ok",
    scope: "line_total",
    unit: "m²",
    quantity: qty,
    yourUnitPrice: yourPerM2,
    marketUnitPrice: marketUnitLine,
    explanation:
      `Sur votre devis : ${formatEuro(line.total)} pour ${qty} m², soit environ ${yourPerM2} €/m². ` +
      `Repère indicatif (${regionLabel}) : ~${lineBench.basePrice} €/m² national → ${marketUnitLine} €/m² × ${qty} m² ≈ ${formatEuro(marketTotal)}. ` +
      `Écart sur ce poste : ${deviation > 0 ? "+" : ""}${Math.round(deviation)} %.`,
  };
}

export function buildPriceComparisons(input: QuoteInput): PriceComparison[] {
  const regionLabel = REGION_LABELS[input.region];
  const comparisons: PriceComparison[] = [];

  for (const line of input.lines.slice(0, 12)) {
    const c = compareLine(line, input, regionLabel);
    if (c) comparisons.push(c);
  }

  return comparisons;
}

export function buildPriceAlerts(comparisons: PriceComparison[]): Alert[] {
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
