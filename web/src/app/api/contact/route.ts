import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/sanitize";
import { readJsonFile, writeJsonFile } from "@/lib/json-store";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

const CONTACT_FILE = "contacts.json";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`contact:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de messages envoyés." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
    }

    const contacts = await readJsonFile<unknown[]>(CONTACT_FILE, []);
    contacts.push({ ...parsed.data, at: new Date().toISOString() });
    await writeJsonFile(CONTACT_FILE, contacts.slice(-500));

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
