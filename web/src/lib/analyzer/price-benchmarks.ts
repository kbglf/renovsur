import type { Region, WorkType } from "../types";

const REGION_MULTIPLIERS: Record<Region, number> = {
  "ile-de-france": 1.25,
  paca: 1.15,
  "auvergne-rhone-alpes": 1.05,
  occitanie: 1.0,
  "nouvelle-aquitaine": 0.98,
  autre: 1.0,
};

/** Prix moyens au m² ou à l'unité en France (2025-2026, sources INSEE / FFB / artisans agrégés) */
export const BENCHMARKS: Record<
  WorkType,
  { label: string; unit: string; basePrice: number; keywords: string[] }
> = {
  peinture: {
    label: "Peinture intérieure",
    unit: "m²",
    basePrice: 28,
    keywords: ["peinture", "enduit", "lessivage", "murs", "plafond"],
  },
  carrelage: {
    label: "Pose carrelage",
    unit: "m²",
    basePrice: 45,
    keywords: ["carrelage", "faïence", "faienc", "grès", "mosaïque"],
  },
  plomberie: {
    label: "Plomberie",
    unit: "forfait",
    basePrice: 850,
    keywords: ["plomberie", "sanitaire", "robinet", "douche", "wc", "évier"],
  },
  electricite: {
    label: "Électricité",
    unit: "forfait",
    basePrice: 1200,
    keywords: ["électric", "elec", "tableau", "prise", "câblage"],
  },
  isolation: {
    label: "Isolation",
    unit: "m²",
    basePrice: 55,
    keywords: ["isolation", "laine", "polystyrène", "combles", "ite"],
  },
  menuiserie: {
    label: "Menuiserie",
    unit: "forfait",
    basePrice: 2500,
    keywords: ["fenêtre", "porte", "menuiserie", "volet", "baie"],
  },
  toiture: {
    label: "Toiture",
    unit: "m²",
    basePrice: 95,
    keywords: ["toiture", "couverture", "tuile", "zinc", "charpente"],
  },
  maconnerie: {
    label: "Maçonnerie",
    unit: "m²",
    basePrice: 75,
    keywords: ["maçon", "macon", "mur", "parpaing", "béton"],
  },
  autre: {
    label: "Travaux divers",
    unit: "forfait",
    basePrice: 1500,
    keywords: [],
  },
};

export function getRegionalPrice(basePrice: number, region: Region): number {
  return Math.round(basePrice * REGION_MULTIPLIERS[region]);
}

export function detectWorkType(text: string): WorkType {
  const lower = text.toLowerCase();
  for (const [type, config] of Object.entries(BENCHMARKS)) {
    if (type === "autre") continue;
    if (config.keywords.some((kw) => lower.includes(kw))) {
      return type as WorkType;
    }
  }
  return "autre";
}
