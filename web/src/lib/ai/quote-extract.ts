import { z } from "zod";

const lineSchema = z.object({
  description: z.string(),
  quantity: z.number().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().optional(),
  total: z.number(),
});

export const aiQuoteExtractSchema = z.object({
  providerName: z.string().optional(),
  clientName: z.string().optional(),
  providerSiret: z.string().optional(),
  clientSiret: z.string().optional(),
  isAutoEntrepreneur: z.boolean().optional(),
  totalAmountHT: z.number().optional(),
  totalAmountTTC: z.number().optional(),
  depositPercent: z.number().optional(),
  lines: z.array(lineSchema).optional(),
  workSummary: z.string().optional(),
});

export type AiQuoteExtract = z.infer<typeof aiQuoteExtractSchema>;

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getAiModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

const SYSTEM_PROMPT = `Tu es un assistant spécialisé dans l'analyse de devis de travaux en France.
Extrais UNIQUEMENT les informations présentes dans le texte. N'invente rien.
Réponds en JSON strict selon le schéma demandé.
- providerSiret = SIRET de l'artisan / entreprise qui réalise les travaux (souvent en pied de page, auto-entrepreneur)
- clientSiret = SIRET du client / donneur d'ordre (souvent en en-tête avec adresse chantier)
- lines = postes de travaux avec montants totaux en euros
- Si une info est absente, omets le champ`;

export async function extractQuoteWithAi(
  quoteText: string,
): Promise<AiQuoteExtract | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const truncated =
    quoteText.length > 28_000 ? `${quoteText.slice(0, 28_000)}\n[…]` : quoteText;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getAiModel(),
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyse ce devis et retourne un JSON avec les clés:
providerName, clientName, providerSiret, clientSiret, isAutoEntrepreneur,
totalAmountHT, totalAmountTTC, depositPercent, workSummary,
lines (tableau de {description, quantity, unit, unitPrice, total}).

DEVIS:
${truncated}`,
          },
        ],
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = aiQuoteExtractSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function generateReportInsights(
  facts: {
    score: number;
    providerName?: string;
    clientName?: string;
    totalAmount: number;
    alertTitles: string[];
    comparisonCount: number;
    savings: number;
    partyReasoning: string[];
    workSummary?: string;
  },
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getAiModel(),
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Rédige un paragraphe de synthèse (4-6 phrases) pour un particulier ou une entreprise qui analyse un devis travaux. " +
              "Utilise UNIQUEMENT les faits fournis. Ton professionnel, prudent, jamais alarmiste gratuit. " +
              "Rappelle que l'analyse est indicative. Pas de listes à puces.",
          },
          {
            role: "user",
            content: JSON.stringify(facts, null, 2),
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}
