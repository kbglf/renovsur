import type { AnalysisResult } from "./types";

const prefix = "renovsur-report:";

export function reportSessionKey(id: string): string {
  return `${prefix}${id}`;
}

export function saveReportToSession(report: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(reportSessionKey(report.id), JSON.stringify(report));
  } catch {
    // quota dépassée — ignoré
  }
}

export function loadReportFromSession(id: string): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(reportSessionKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}
