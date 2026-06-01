import { PDFParse } from "pdf-parse";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 Mo

export async function extractTextFromPdf(buffer: Buffer): Promise<{
  text: string;
  pages: number;
}> {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error("PDF trop volumineux (max 10 Mo)");
  }

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim() ?? "";
    if (text.length < 30) {
      throw new Error(
        "Impossible d'extraire le texte de ce PDF. Il est peut-être scanné (image) — copiez-collez le texte manuellement.",
      );
    }

    return { text, pages: result.total ?? result.pages.length ?? 1 };
  } finally {
    await parser.destroy();
  }
}

export { MAX_PDF_BYTES };
