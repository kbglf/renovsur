import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";

const DATA_DIR = path.join(process.cwd(), "data");

function useBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function blobPathname(filename: string): string {
  return `renovsur/${filename}`;
}

async function readBlobJson<T>(filename: string, fallback: T): Promise<T> {
  const result = await get(blobPathname(filename), { access: "private" });
  if (!result) return fallback;

  const text = await new Response(result.stream).text();
  if (!text.trim()) return fallback;
  return JSON.parse(text) as T;
}

/** Lecture/écriture JSON : disque local en dev, Vercel Blob en production */
export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  if (useBlobStorage()) {
    try {
      return await readBlobJson(filename, fallback);
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

  const filePath = path.join(DATA_DIR, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf-8");
}
