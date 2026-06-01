import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPdf, MAX_PDF_BYTES } from "@/lib/pdf-extract";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/sanitize";
import { MAX_QUOTE_LENGTH } from "@/lib/constants";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(`pdf:${ip}`);
  if (!limit.ok) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Fichier PDF manquant" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Format accepté : PDF uniquement" }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF trop volumineux (max 10 Mo)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, pages } = await extractTextFromPdf(buffer);

    return NextResponse.json({
      text: text.slice(0, MAX_QUOTE_LENGTH),
      pages,
      fileName: file.name,
      charCount: text.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lecture PDF";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
