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

function parseTableLineChunk(line: string): QuoteLine | null {
  const trimmed = line.replace(/\t+/g, " ").trim();
  if (trimmed.length < 8) return null;
  if (METADATA_LINE.test(trimmed) || SUMMARY_LINE.test(trimmed)) return null;
  if (/^description\s/i.test(trimmed)) return null;

  const withDate =
    /^(.+?)\s+\d{1,2}\/\d{1,2}\/\d{2,4}\s+([\d,]+)\s+(pce|u\.?|unité|unité|m²|m2)\s+([\d\s,]*)\s*€?\s*([\d\s,]+)\s*€\s*$/i.exec(
      trimmed,
    );
  if (withDate) {
    const total = parseFrenchEuroAmount(withDate[5]);
    if (!total || total < 10) return null;
    const qty = parseFrenchEuroAmount(withDate[2].replace(",", "."));
    const unit = withDate[3].toLowerCase();
    const unitPriceRaw = withDate[4].trim();
    const unitPrice = unitPriceRaw
      ? parseFrenchEuroAmount(unitPriceRaw)
      : qty && qty > 0
        ? Math.round(total / qty)
        : undefined;
    const description = withDate[1].trim().replace(/\s+/g, " ");
    if (description.length < 3) return null;
    return {
      description,
      quantity: qty ?? undefined,
      unit,
      unitPrice: unitPrice ?? undefined,
      total,
    };
  }

  const simpleTable =
    /^(.+?)\s+([\d,]+)\s+(pce|u\.?|unité|m²|m2)\s+([\d\s,]+)\s*€\s+([\d\s,]+)\s*€\s*$/i.exec(
      trimmed,
    );
  if (simpleTable) {
    const total = parseFrenchEuroAmount(simpleTable[5]);
    if (!total || total < 10) return null;
    const qty = parseFrenchEuroAmount(simpleTable[2].replace(",", "."));
    return {
      description: simpleTable[1].trim().replace(/\s+/g, " "),
      quantity: qty ?? undefined,
      unit: simpleTable[3].toLowerCase(),
      unitPrice: parseFrenchEuroAmount(simpleTable[4]) ?? undefined,
      total,
    };
  }

  return null;
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
    const parsed = parseTableLineChunk(rawLine) ?? parseLineChunk(rawLine);
    if (!parsed) continue;
    const key = `${parsed.description}|${parsed.total}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(parsed);
  }

  return lines;
}

/** Acompte en % — évite de capturer un chiffre d'une autre ligne (ex. « 55 » lu comme « 5 » + « 5% ») */
export function extractDepositPercent(text: string): number | undefined {
  const match = text.match(/acompte[^%\d\n]{0,40}(\d{1,3})\s*%/i);
  if (!match) return undefined;
  const n = parseInt(match[1], 10);
  return n > 0 && n <= 100 ? n : undefined;
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

export function extractFirstSiret(text: string): string | undefined {
  const m = text.match(/\b(\d{3}\s?\d{3}\s?\d{3}\s?\d{5})\b/);
  return m?.[1].replace(/\s/g, "");
}

export { extractSiretCandidates } from "./siret-roles";
