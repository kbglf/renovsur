import type { QuoteLine } from "./types";

/** Montant français : « 1 862 », « 2 048,50 », « 980 » */
export function parseFrenchEuroAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

const METADATA_LINE =
  /^(tél|tel|phone|siret|adresse|email|@|devis\s+n|validité|validite|conditions\s+de\s+paiement)/i;

const SUMMARY_LINE =
  /^(total\s|tva\s|acompte|solde\s|sous[-\s]total|net\s+à\s+payer)/i;

export interface QuoteTotals {
  ht?: number;
  tva?: number;
  ttc?: number;
}

export function extractQuoteTotals(text: string): QuoteTotals {
  const ht = text.match(/total\s+ht\s*[:\s]*(\d[\d\s.,]*)\s*€/i);
  const tva = text.match(/tva\s*(?:\d+\s*%)?\s*[:\s]*(\d[\d\s.,]*)\s*€/i);
  const ttc = text.match(/total\s+ttc\s*[:\s]*(\d[\d\s.,]*)\s*€/i);

  return {
    ht: ht ? (parseFrenchEuroAmount(ht[1]) ?? undefined) : undefined,
    tva: tva ? (parseFrenchEuroAmount(tva[1]) ?? undefined) : undefined,
    ttc: ttc ? (parseFrenchEuroAmount(ttc[1]) ?? undefined) : undefined,
  };
}

function parseLineChunk(line: string): QuoteLine | null {
  const trimmed = line.trim();
  if (trimmed.length < 5) return null;
  if (METADATA_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) return null;

  const priceMatch = trimmed.match(/(\d[\d\s.,]*)\s*€\s*$/i);
  if (!priceMatch) return null;

  const total = parseFrenchEuroAmount(priceMatch[1]);
  if (!total || total < 15) return null;

  const description = trimmed
    .replace(priceMatch[0], "")
    .trim()
    .replace(/\s*—\s*$/u, "")
    .replace(/\s*-\s*$/u, "");

  if (description.length < 3) return null;

  return { description, total };
}

/** Extrait les postes de travaux (pas les totaux HT/TTC/TVA) */
export function parseLinesFromText(text: string): QuoteLine[] {
  const lines: QuoteLine[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split("\n")) {
    const parsed = parseLineChunk(rawLine);
    if (!parsed) continue;
    const key = `${parsed.description}|${parsed.total}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(parsed);
  }

  return lines;
}

export function extractTotalFromText(text: string, lines: QuoteLine[]): number {
  const totals = extractQuoteTotals(text);
  if (totals.ttc) return totals.ttc;

  const totalMatch = text.match(
    /total\s+(?:ttc|g[ée]n[ée]ral)?\s*[:\s]*(\d[\d\s.,]*)\s*€/i,
  );
  if (totalMatch) {
    const v = parseFrenchEuroAmount(totalMatch[1]);
    if (v) return v;
  }

  if (lines.length > 0) {
    const sum = lines.reduce((s, l) => s + (l.total ?? 0), 0);
    if (totals.ht && Math.abs(sum - totals.ht) < 50) return totals.ht;
    return sum;
  }

  return 0;
}
