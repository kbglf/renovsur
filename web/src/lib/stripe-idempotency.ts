import { readJsonFile, writeJsonFile } from "./json-store";

interface ProcessedEntry {
  sessionId: string;
  processedAt: string;
  planId: string;
  reportId?: string;
  deviceId?: string;
}

const FILE = "processed-sessions.json";

async function readAll(): Promise<ProcessedEntry[]> {
  return readJsonFile<ProcessedEntry[]>(FILE, []);
}

async function writeAll(entries: ProcessedEntry[]) {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const pruned = entries.filter(
    (e) => new Date(e.processedAt).getTime() > cutoff,
  );
  await writeJsonFile(FILE, pruned.slice(-5000));
}

export async function isSessionProcessed(sessionId: string): Promise<boolean> {
  const entries = await readAll();
  return entries.some((e) => e.sessionId === sessionId);
}

export async function markSessionProcessed(entry: Omit<ProcessedEntry, "processedAt">) {
  const entries = await readAll();
  if (entries.some((e) => e.sessionId === entry.sessionId)) return;
  entries.push({ ...entry, processedAt: new Date().toISOString() });
  await writeAll(entries);
}
