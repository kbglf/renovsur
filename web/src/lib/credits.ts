import type { AnalysisResult } from "./types";
import { readJsonFile, writeJsonFile } from "./json-store";

interface CreditBalance {
  balance: number;
  plan: "complete" | "negotiation";
  updatedAt: string;
}

const CREDITS_FILE = "credits.json";

async function readAll(): Promise<Record<string, CreditBalance>> {
  return readJsonFile<Record<string, CreditBalance>>(CREDITS_FILE, {});
}

async function writeAll(data: Record<string, CreditBalance>) {
  await writeJsonFile(CREDITS_FILE, data);
}

export async function getCredits(deviceId: string): Promise<CreditBalance | null> {
  const all = await readAll();
  const entry = all[deviceId];
  if (!entry || entry.balance <= 0) return null;
  return entry;
}

export async function addCredits(
  deviceId: string,
  amount: number,
  plan: "complete" | "negotiation" = "complete",
): Promise<number> {
  const all = await readAll();
  const current = all[deviceId]?.balance ?? 0;
  const next = current + amount;
  all[deviceId] = { balance: next, plan, updatedAt: new Date().toISOString() };
  await writeAll(all);
  return next;
}

export async function consumeCredit(
  deviceId: string,
): Promise<{ plan: AnalysisResult["plan"] } | null> {
  const all = await readAll();
  const entry = all[deviceId];
  if (!entry || entry.balance <= 0) return null;

  entry.balance -= 1;
  entry.updatedAt = new Date().toISOString();
  if (entry.balance <= 0) delete all[deviceId];
  else all[deviceId] = entry;
  await writeAll(all);
  return { plan: entry.plan };
}
