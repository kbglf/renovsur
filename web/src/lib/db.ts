import type { AnalysisResult } from "./types";
import { readJsonFile, writeJsonFile } from "./json-store";

const REPORTS_FILE = "reports.json";

async function readReports(): Promise<AnalysisResult[]> {
  return readJsonFile<AnalysisResult[]>(REPORTS_FILE, []);
}

async function writeReports(reports: AnalysisResult[]) {
  await writeJsonFile(REPORTS_FILE, reports);
}

export async function saveReport(report: AnalysisResult): Promise<void> {
  const reports = await readReports();
  const index = reports.findIndex((r) => r.id === report.id);
  if (index >= 0) {
    reports[index] = report;
  } else {
    reports.unshift(report);
  }
  await writeReports(reports.slice(0, 500));
}

export async function getReport(id: string): Promise<AnalysisResult | null> {
  const reports = await readReports();
  return reports.find((r) => r.id === id) ?? null;
}

export async function getReportsByEmail(email: string): Promise<AnalysisResult[]> {
  const normalized = email.trim().toLowerCase();
  const reports = await readReports();
  return reports
    .filter(
      (r) =>
        r.input.email?.trim().toLowerCase() === normalized ||
        r.email?.trim().toLowerCase() === normalized,
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateReportPlan(
  id: string,
  plan: AnalysisResult["plan"],
): Promise<AnalysisResult | null> {
  const report = await getReport(id);
  if (!report) return null;
  report.plan = plan;
  report.isPaid = plan !== "free";
  await saveReport(report);
  return report;
}
