import { promises as fs } from "fs";
import path from "path";
import { head, put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPathname(filename: string): string {
  return `renovsur/${filename}`;
}

/** Lecture/écriture JSON : disque local en dev, Vercel Blob en production */
export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (useBlobStorage()) {
    try {
      const meta = await head(blobPathname(filename));
      const res = await fetch(meta.url);
      if (!res.ok) return fallback;
      return (await res.json()) as T;
    } catch {
      return fallback;
    }
  }

  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), "utf-8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  const content = JSON.stringify(data, null, 2);

  if (useBlobStorage()) {
    await put(blobPathname(filename), content, {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, filename), content, "utf-8");
}
