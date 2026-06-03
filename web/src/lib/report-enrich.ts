import type { AnalysisResult, Alert, QuoteLine } from "./types";
import type { AiQuoteExtract } from "./ai/quote-extract";
import {
  extractSiretCandidates,
  resolveParties,
  type PartyResolution,
} from "./siret-roles";
import {
  lookupSiretRegistry,
  verifyCompanyRegistry,
  normalizeSiret,
  type SiretVerification,
} from "./registry-verify";
import { applyCompanyRegistryVerification } from "./siret-enrich";
import { extractQuoteWithAi, generateReportInsights } from "./ai/quote-extract";
import { refreshReportScore, refreshPriceAnalysis } from "./analyzer";

export interface EnrichReportOptions {
  useAi: boolean;
  providerSiretHint?: string;
  aiExtract?: AiQuoteExtract | null;
}

function mergeLines(ruleLines: QuoteLine[], aiLines?: QuoteLine[]): QuoteLine[] {
  if (!aiLines?.length) return ruleLines;
  if (aiLines.length > ruleLines.length) return aiLines;
  if (ruleLines.length === 0) return aiLines;
  return ruleLines;
}

function buildPartyAlerts(
  parties: PartyResolution,
  providerName?: string,
): Alert[] {
  const alerts: Alert[] = [];

  if (parties.invalidProviderCandidates.length > 0) {
    alerts.push({
      id: "siret-invalid-candidate",
      severity: "critical",
      title: "SIRET prestataire illisible ou incomplet",
      description: `Numéro détecté en pied de page : « ${parties.invalidProviderCandidates[0]} » (${parties.invalidProviderCandidates[0].replace(/\D/g, "").length} chiffres — un SIRET valide en compte 14).`,
      recommendation:
        "Demandez le SIRET à 14 chiffres de l'artisan qui réalisera les travaux, et vérifiez-le sur annuaire-entreprises.data.gouv.fr.",
    });
  }

  if (
    parties.providerVerification?.status === "active" &&
    parties.clientVerification?.status === "active" &&
    parties.providerSiret !== parties.clientSiret
  ) {
    alerts.push({
      id: "siret-dual-party",
      severity: "info",
      title: "Devis entre deux entreprises (client + prestataire)",
      description: [
        parties.clientVerification.companyName &&
          `Client : ${parties.clientVerification.companyName}.`,
        parties.providerVerification.companyName &&
          `Prestataire : ${parties.providerVerification.companyName}${providerName ? ` (${providerName})` : ""}.`,
        parties.providerVerification.activityCode &&
          `Activité prestataire : ${parties.providerVerification.activityCode}.`,
      ]
        .filter(Boolean)
        .join(" "),
      recommendation:
        "Vérifiez que le contrat et la facturation seront au nom du prestataire identifié, pas du client.",
    });
  }

  if (
    parties.providerVerification?.status === "active" &&
    parties.providerVerification.companyName &&
    providerName
  ) {
    const prov = parties.providerVerification.companyName.toLowerCase();
    const devisName = providerName.toLowerCase();
    if (
      !prov.includes(devisName.slice(0, 8)) &&
      !devisName.includes(prov.slice(0, 8))
    ) {
      alerts.push({
        id: "siret-name-mismatch",
        severity: "warning",
        title: "Nom sur le devis ≠ registre (prestataire)",
        description: `Le devis mentionne « ${providerName} » mais le SIRET prestataire est enregistré au nom de « ${parties.providerVerification.companyName} » au registre national.`,
        recommendation:
          "Demandez confirmation écrite que c'est bien la même entreprise (raison sociale, KBIS ou extrait SIRENE).",
      });
    }
  }

  return alerts;
}

async function lookupAllSirets(
  candidates: ReturnType<typeof extractSiretCandidates>,
  hint?: string,
): Promise<Map<string, SiretVerification>> {
  const map = new Map<string, SiretVerification>();
  const toFetch = new Set<string>();

  for (const c of candidates) {
    if (c.normalized) toFetch.add(c.normalized);
  }
  const hintNorm = hint ? normalizeSiret(hint) : null;
  if (hintNorm) toFetch.add(hintNorm);

  await Promise.all(
    [...toFetch].map(async (siret) => {
      map.set(siret, await lookupSiretRegistry(siret));
    }),
  );

  return map;
}

/** Enrichissement : multi-SIRET, registre, IA optionnelle (rapport payant) */
export async function enrichReport(
  report: AnalysisResult,
  options: EnrichReportOptions,
): Promise<void> {
  let aiExtract = options.aiExtract ?? null;

  if (options.useAi && !aiExtract) {
    aiExtract = await extractQuoteWithAi(report.input.quoteText);
  }

  if (aiExtract) {
    report.aiEnhanced = true;
    const merged = mergeLines(
      report.input.lines,
      aiExtract.lines?.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitPrice: l.unitPrice,
        total: l.total,
      })),
    );
    if (merged.length >= report.input.lines.length) {
      report.input.lines = merged;
      refreshPriceAnalysis(report);
    }
    if (aiExtract.depositPercent && !report.input.depositPercent) {
      report.input.depositPercent = aiExtract.depositPercent;
    }
    if (aiExtract.totalAmountTTC && report.input.totalAmount <= 0) {
      report.input.totalAmount = aiExtract.totalAmountTTC;
    }
    if (aiExtract.providerName && !report.input.artisanName) {
      report.input.artisanName = aiExtract.providerName;
    }
  }

  const candidates = extractSiretCandidates(report.input.quoteText);
  const verifications = await lookupAllSirets(
    candidates,
    options.providerSiretHint,
  );

  const parties = resolveParties(candidates, verifications, report.input.quoteText, {
    userProviderSiret: options.providerSiretHint,
    aiProviderSiret: aiExtract?.providerSiret,
    aiClientSiret: aiExtract?.clientSiret,
    artisanName: report.input.artisanName ?? aiExtract?.providerName,
  });

  report.partyResolution = {
    confidence: parties.confidence,
    reasoning: parties.reasoning,
  };
  report.clientSiretVerification = parties.clientVerification ?? undefined;
  report.input.clientSiret = parties.clientSiret ?? undefined;

  if (parties.providerSiret) {
    report.input.providerSiret = parties.providerSiret;
    report.input.siret = parties.providerSiret;

    const bundle = await verifyCompanyRegistry(parties.providerSiret, {
      quoteText: report.input.quoteText,
      workType: report.input.workType,
      totalAmount: report.input.totalAmount,
    });
    applyCompanyRegistryVerification(report, bundle);
    report.providerSiretVerification = bundle.siret;
    report.siretVerification = bundle.siret;
  } else if (parties.clientSiret && parties.clientVerification) {
    report.clientSiretVerification = parties.clientVerification;
  }

  const partyAlerts = buildPartyAlerts(
    parties,
    report.input.artisanName ?? aiExtract?.providerName,
  );
  if (partyAlerts.length > 0) {
    const ids = new Set(partyAlerts.map((a) => a.id));
    report.alerts = report.alerts.filter((a) => !ids.has(a.id));
    report.alerts.unshift(...partyAlerts);
  }

  refreshReportScore(report);

  if (options.useAi && aiExtract) {
    const insights = await generateReportInsights({
      score: report.score,
      providerName: report.input.artisanName ?? aiExtract.providerName,
      clientName: aiExtract.clientName,
      totalAmount: report.input.totalAmount,
      alertTitles: report.alerts.slice(0, 6).map((a) => a.title),
      comparisonCount: report.priceComparisons.length,
      savings: report.totalSavingsEstimate,
      partyReasoning: parties.reasoning,
      workSummary: aiExtract.workSummary,
    });
    if (insights) report.analysisInsights = insights;
  }
}
