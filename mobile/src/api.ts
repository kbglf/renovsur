import { API_URL } from "./config";

export interface AnalyzeResponse {
  id: string;
  score: number;
  scoreLabel: string;
  summary: string;
  alertsCount: number;
  alerts: {
    id: string;
    severity: "critical" | "warning" | "info";
    title: string;
    description: string;
    recommendation: string;
    savingsEstimate?: number;
  }[];
}

export async function analyzeQuote(payload: {
  quoteText: string;
  workType: string;
  region: string;
  surfaceM2?: number;
  totalAmount?: number;
  depositPercent?: number;
}): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));
  if (res.status === 409 && body.existingReportId) {
    const err = new Error("DUPLICATE") as Error & { reportId?: string };
    err.reportId = body.existingReportId;
    throw err;
  }
  if (!res.ok) {
    throw new Error(body.error || "Erreur réseau");
  }

  return {
    ...body,
    alertsCount: body.alertCounts?.total ?? body.alerts?.length ?? 0,
  };
}

export async function getReport(id: string) {
  const res = await fetch(`${API_URL}/api/reports/${id}`);
  if (!res.ok) throw new Error("Rapport introuvable");
  return res.json();
}

export async function createCheckout(reportId: string, planId: "complete" | "negotiation") {
  const res = await fetch(`${API_URL}/api/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId, planId }),
  });
  return res.json();
}
