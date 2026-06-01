import { createHash } from "crypto";
import { FREE_PREVIEW_LIFETIME, QUOTA_RETENTION_MS, SAMPLE_QUOTE } from "./constants";
import { readJsonFile, writeJsonFile } from "./json-store";

interface QuotaRecord {
  at: string;
  ip: string;
  deviceId: string;
  quoteHash: string;
  reportId: string;
  wasPreview: boolean;
}

const QUOTA_FILE = "quotas.json";

async function readRecords(): Promise<QuotaRecord[]> {
  return readJsonFile<QuotaRecord[]>(QUOTA_FILE, []);
}

async function writeRecords(records: QuotaRecord[]) {
  const cutoff = Date.now() - QUOTA_RETENTION_MS;
  const pruned = records.filter((r) => new Date(r.at).getTime() > cutoff);
  await writeJsonFile(QUOTA_FILE, pruned.slice(-3000));
}

export function hashQuote(text: string): string {
  return createHash("sha256").update(text.trim().toLowerCase()).digest("hex");
}

export function isSampleQuote(text: string): boolean {
  return hashQuote(text) === hashQuote(SAMPLE_QUOTE);
}

export type QuotaCheckResult =
  | { allowed: true; freePreviewRemaining: number }
  | {
      allowed: false;
      reason: "lifetime_used" | "duplicate";
      existingReportId?: string;
    };

export async function checkFreeQuota(
  ip: string,
  deviceId: string,
  quoteText: string,
): Promise<QuotaCheckResult> {
  if (isSampleQuote(quoteText)) {
    return { allowed: true, freePreviewRemaining: 1 };
  }

  const records = await readRecords();
  const quoteHash = hashQuote(quoteText);
  const match = (r: QuotaRecord) => r.ip === ip || r.deviceId === deviceId;

  const sameQuote = records.find(
    (r) => r.quoteHash === quoteHash && match(r) && r.wasPreview,
  );
  if (sameQuote) {
    return {
      allowed: false,
      reason: "duplicate",
      existingReportId: sameQuote.reportId,
    };
  }

  const previewUsed = records.filter(
    (r) => match(r) && r.wasPreview && !isSampleQuoteByHash(r.quoteHash),
  ).length;

  if (previewUsed >= FREE_PREVIEW_LIFETIME) {
    return { allowed: false, reason: "lifetime_used" };
  }

  return {
    allowed: true,
    freePreviewRemaining: FREE_PREVIEW_LIFETIME - previewUsed,
  };
}

function isSampleQuoteByHash(hash: string): boolean {
  return hash === hashQuote(SAMPLE_QUOTE);
}

export async function recordFreePreview(
  ip: string,
  deviceId: string,
  quoteText: string,
  reportId: string,
): Promise<void> {
  if (isSampleQuote(quoteText)) return;

  const records = await readRecords();
  records.push({
    at: new Date().toISOString(),
    ip,
    deviceId,
    quoteHash: hashQuote(quoteText),
    reportId,
    wasPreview: true,
  });
  await writeRecords(records);
}
