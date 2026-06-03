import type { Region } from "../types";
import { getRegionalPrice } from "./price-benchmarks";

export interface PieceBenchmark {
  id: string;
  label: string;
  baseUnitPrice: number;
  keywords: string[];
}

/** Repères indicatifs au poste / pièce (peinture extérieure, menuiserie…) */
export const PIECE_BENCHMARKS: PieceBenchmark[] = [
  {
    id: "fenetre_volet_ext",
    label: "Peinture fenêtre ou volet (ext.)",
    baseUnitPrice: 120,
    keywords: ["fenêtre", "fenetre", "volet", "volets"],
  },
  {
    id: "porte_peinture",
    label: "Peinture porte",
    baseUnitPrice: 175,
    keywords: ["porte d", "porte ", "portes"],
  },
  {
    id: "facade_peinture",
    label: "Peinture façade extérieure",
    baseUnitPrice: 280,
    keywords: ["façade", "facade", "extérieur", "exterieur"],
  },
  {
    id: "portail_garage",
    label: "Peinture portail / garage",
    baseUnitPrice: 150,
    keywords: ["portail", "garage", "portillon"],
  },
];

export function detectPieceBenchmark(description: string): PieceBenchmark | null {
  const lower = description.toLowerCase();
  for (const bench of PIECE_BENCHMARKS) {
    if (bench.keywords.some((kw) => lower.includes(kw))) {
      return bench;
    }
  }
  return null;
}

export function isPieceUnit(unit?: string): boolean {
  if (!unit) return false;
  const u = unit.toLowerCase();
  return u === "pce" || u === "u" || u === "u." || u.startsWith("unit");
}

export function marketPieceUnitPrice(bench: PieceBenchmark, region: Region): number {
  return getRegionalPrice(bench.baseUnitPrice, region);
}
