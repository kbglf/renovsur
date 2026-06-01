import type {
  DecennaleVerification,
  RgeVerification,
  SiretVerification,
} from "./registry-verify";

export type WorkType =
  | "peinture"
  | "carrelage"
  | "plomberie"
  | "electricite"
  | "isolation"
  | "menuiserie"
  | "toiture"
  | "maconnerie"
  | "autre";

export type Region =
  | "ile-de-france"
  | "paca"
  | "auvergne-rhone-alpes"
  | "occitanie"
  | "nouvelle-aquitaine"
  | "autre";

export type AlertSeverity = "critical" | "warning" | "info";

export interface QuoteLine {
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  total?: number;
}

export interface QuoteInput {
  artisanName?: string;
  siret?: string;
  quoteText: string;
  lines: QuoteLine[];
  totalAmount: number;
  workType: WorkType;
  surfaceM2?: number;
  region: Region;
  hasDecennale?: boolean;
  validityDays?: number;
  depositPercent?: number;
  email?: string;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
  recommendation: string;
  savingsEstimate?: number;
}

export interface PriceComparison {
  item: string;
  yourPrice: number;
  marketAverage: number;
  deviationPercent: number;
  status: "ok" | "high" | "very_high";
}

export interface AnalysisResult {
  id: string;
  createdAt: string;
  score: number;
  scoreLabel: string;
  summary: string;
  alerts: Alert[];
  priceComparisons: PriceComparison[];
  legalChecks: { label: string; passed: boolean; detail: string }[];
  /** Conseils pour le particulier */
  negotiationAdvice: string[];
  /** Lettre formelle à envoyer à l'artisan */
  negotiationLetter: string;
  /** @deprecated Anciens rapports — préférer negotiationAdvice */
  negotiationPoints?: string[];
  totalSavingsEstimate: number;
  isPaid: boolean;
  plan: "free" | "complete" | "negotiation";
  input: QuoteInput;
  email?: string;
  paidWithCredit?: boolean;
  siretVerification?: SiretVerification;
  rgeVerification?: RgeVerification;
  decennaleVerification?: DecennaleVerification;
}

export type PlanId = "complete" | "negotiation" | "compare3";
