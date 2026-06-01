import type { AnalysisResult } from "./types";
import { readJsonFile, writeJsonFile } from "./json-store";

/** Un fichier par rapport — évite les conflits d'écriture sur Vercel Blob */
function reportFile(id: string): string {
  return `reports/${id}.json`;
}

interface ReportIndexEntry {
  id: string;
  email?: string;
  createdAt: string;
}

const INDEX_FILE = "reports-index.json";

async function readIndex(): Promise<ReportIndexEntry[]> {
  return readJsonFile<ReportIndexEntry[]>(INDEX_FILE, []);
}

async function upsertIndex(report: AnalysisResult): Promise<void> {
  const index = await readIndex();
  const email = report.email ?? report.input.email?.trim().toLowerCase();
  const entry: ReportIndexEntry = {
    id: report.id,
    email,
    createdAt: report.createdAt,
  };
  const i = index.findIndex((e) => e.id === report.id);
  if (i >= 0) index[i] = entry;
  else index.unshift(entry);
  await writeJsonFile(INDEX_FILE, index.slice(0, 500));
}

export async function saveReport(report: AnalysisResult): Promise<void> {
  await writeJsonFile(reportFile(report.id), report);
  await upsertIndex(report);
}

export async function getReport(id: string): Promise<AnalysisResult | null> {
  const report = await readJsonFile<AnalysisResult | null>(reportFile(id), null);
  return report ?? null;
}

export async function getReportsByEmail(email: string): Promise<AnalysisResult[]> {
  const normalized = email.trim().toLowerCase();
  const index = await readIndex();
  const ids = index
    .filter((e) => e.email?.toLowerCase() === normalized)
    .map((e) => e.id);

  const reports = await Promise.all(ids.map((id) => getReport(id)));
  return reports
    .filter((r): r is AnalysisResult => r !== null)
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
