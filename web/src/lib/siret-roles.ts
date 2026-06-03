import type { SiretVerification } from "./registry-verify";
import { isTradeNaf, normalizeSiret } from "./registry-verify";

export interface SiretCandidate {
  raw: string;
  /** 14 chiffres normalisés, ou null si invalide */
  normalized: string | null;
  index: number;
  context: string;
}

const SIRET_FORMATTED =
  /(\d{3}\s*\d{3}\s*\d{3}\s*\d{5})/g;
const SIRET_LABEL =
  /siret\s*[:\s]*([\d\s]{13,17})/gi;

/** Tous les SIRET candidats dans le texte (valides + invalides près du mot « SIRET ») */
export function extractSiretCandidates(text: string): SiretCandidate[] {
  const seen = new Set<string>();
  const out: SiretCandidate[] = [];

  function push(raw: string, index: number) {
    const key = raw.replace(/\D/g, "");
    if (key.length < 13 || seen.has(key)) return;
    seen.add(key);
    const normalized = normalizeSiret(raw);
    const start = Math.max(0, index - 60);
    out.push({
      raw,
      normalized,
      index,
      context: text.slice(start, index + 80).replace(/\s+/g, " "),
    });
  }

  for (const m of text.matchAll(SIRET_FORMATTED)) {
    if (m.index !== undefined) push(m[1], m.index);
  }

  for (const m of text.matchAll(SIRET_LABEL)) {
    if (m.index !== undefined) push(m[1], m.index);
  }

  return out.sort((a, b) => a.index - b.index);
}

export interface PartyResolution {
  providerSiret: string | null;
  clientSiret: string | null;
  providerVerification: SiretVerification | null;
  clientVerification: SiretVerification | null;
  invalidProviderCandidates: string[];
  confidence: "high" | "medium" | "low";
  reasoning: string[];
}

function scoreProvider(
  candidate: SiretCandidate,
  verification: SiretVerification | null,
  quoteText: string,
  textLength: number,
  hints: {
    userProviderSiret?: string;
    aiProviderSiret?: string;
    aiClientSiret?: string;
    artisanName?: string;
  },
): number {
  if (!candidate.normalized) return -100;

  let score = 0;
  const ctx = candidate.context.toLowerCase();
  const lower = quoteText.toLowerCase();

  if (hints.userProviderSiret === candidate.normalized) score += 200;
  if (hints.aiProviderSiret === candidate.normalized) score += 150;
  if (hints.aiClientSiret === candidate.normalized) score -= 150;

  if (/auto[-\s]?entrepreneur|artisan|entreprise\s+de\s+peinture|décor|decor|rénov|renov|travaux/.test(ctx)) {
    score += 40;
  }
  if (/auto[-\s]?entrepreneur/.test(lower) && candidate.index > textLength * 0.45) {
    score += 35;
  }
  if (candidate.index < textLength * 0.25 && /adresse|chantier|client|commande|facturer/.test(ctx)) {
    score -= 30;
  }
  if (candidate.index > textLength * 0.55) score += 25;

  if (verification?.activityCode && isTradeNaf(verification.activityCode)) score += 60;
  if (verification?.activityCode && !isTradeNaf(verification.activityCode)) score -= 40;

  if (hints.artisanName && ctx.includes(hints.artisanName.toLowerCase().slice(0, 12))) {
    score += 30;
  }

  if (verification?.companyName) {
    const name = verification.companyName.toLowerCase();
    if (/peinture|décor|decor|rénov|renov|bâtiment|batiment|travaux|menuiserie/.test(name)) {
      score += 25;
    }
  }

  return score;
}

function scoreClient(
  candidate: SiretCandidate,
  verification: SiretVerification | null,
  quoteText: string,
  textLength: number,
  hints: { aiClientSiret?: string; aiProviderSiret?: string },
): number {
  if (!candidate.normalized) return -100;

  let score = 0;
  const ctx = candidate.context.toLowerCase();

  if (hints.aiClientSiret === candidate.normalized) score += 150;
  if (hints.aiProviderSiret === candidate.normalized) score -= 150;

  if (candidate.index < textLength * 0.3) score += 30;
  if (/adresse|chantier|client|livraison|facturation/.test(ctx)) score += 25;
  if (verification?.activityCode && !isTradeNaf(verification.activityCode)) score += 45;
  if (verification?.activityCode && isTradeNaf(verification.activityCode)) score -= 35;

  return score;
}

export function resolveParties(
  candidates: SiretCandidate[],
  verifications: Map<string, SiretVerification>,
  quoteText: string,
  hints: {
    userProviderSiret?: string;
    aiProviderSiret?: string;
    aiClientSiret?: string;
    artisanName?: string;
  } = {},
): PartyResolution {
  const reasoning: string[] = [];
  const validCandidates = candidates.filter((c) => c.normalized);
  const invalidNearLabel = candidates.filter((c) => !c.normalized);

  if (hints.userProviderSiret) {
    const norm = normalizeSiret(hints.userProviderSiret);
    if (norm) {
      reasoning.push("SIRET prestataire indiqué manuellement.");
      return {
        providerSiret: norm,
        clientSiret: validCandidates.find((c) => c.normalized !== norm)?.normalized ?? null,
        providerVerification: verifications.get(norm) ?? null,
        clientVerification:
          validCandidates
            .map((c) => c.normalized!)
            .filter((s) => s !== norm)
            .map((s) => verifications.get(s) ?? null)
            .find(Boolean) ?? null,
        invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
        confidence: "high",
        reasoning,
      };
    }
  }

  if (validCandidates.length === 0) {
    return {
      providerSiret: null,
      clientSiret: null,
      providerVerification: null,
      clientVerification: null,
      invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
      confidence: "low",
      reasoning: ["Aucun SIRET valide détecté dans le devis."],
    };
  }

  if (validCandidates.length === 1) {
    const siret = validCandidates[0].normalized!;
    const v = verifications.get(siret) ?? null;

    if (v?.activityCode && !isTradeNaf(v.activityCode)) {
      reasoning.push(
        "Un seul SIRET valide — activité non BTP : identifié comme client / donneur d'ordre.",
      );
      return {
        providerSiret: null,
        clientSiret: siret,
        providerVerification: null,
        clientVerification: v,
        invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
        confidence: "medium",
        reasoning,
      };
    }

    const asProvider = scoreProvider(
      validCandidates[0],
      v,
      quoteText,
      quoteText.length,
      hints,
    );
    const asClient = scoreClient(
      validCandidates[0],
      v,
      quoteText,
      quoteText.length,
      hints,
    );

    if (asProvider >= asClient) {
      reasoning.push("Un seul SIRET — interprété comme prestataire (contexte + activité).");
      return {
        providerSiret: siret,
        clientSiret: null,
        providerVerification: v,
        clientVerification: null,
        invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
        confidence: asProvider > 30 ? "medium" : "low",
        reasoning,
      };
    }
    reasoning.push("Un seul SIRET — interprété comme client (activité non BTP).");
    return {
      providerSiret: null,
      clientSiret: siret,
      providerVerification: null,
      clientVerification: v,
      invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
      confidence: "medium",
      reasoning,
    };
  }

  let bestProvider: SiretCandidate | null = null;
  let bestProviderScore = -Infinity;
  let bestClient: SiretCandidate | null = null;
  let bestClientScore = -Infinity;

  for (const c of validCandidates) {
    const v = verifications.get(c.normalized!) ?? null;
    const ps = scoreProvider(c, v, quoteText, quoteText.length, hints);
    const cs = scoreClient(c, v, quoteText, quoteText.length, hints);
    if (ps > bestProviderScore) {
      bestProviderScore = ps;
      bestProvider = c;
    }
    if (cs > bestClientScore) {
      bestClientScore = cs;
      bestClient = c;
    }
  }

  let providerSiret = bestProvider?.normalized ?? null;
  let clientSiret = bestClient?.normalized ?? null;

  if (providerSiret === clientSiret && validCandidates.length >= 2) {
    const sorted = [...validCandidates].sort(
      (a, b) =>
        scoreProvider(b, verifications.get(b.normalized!) ?? null, quoteText, quoteText.length, hints) -
        scoreProvider(a, verifications.get(a.normalized!) ?? null, quoteText, quoteText.length, hints),
    );
    providerSiret = sorted[0].normalized;
    clientSiret = sorted.find((c) => c.normalized !== providerSiret)?.normalized ?? null;
  }

  if (hints.aiProviderSiret && normalizeSiret(hints.aiProviderSiret)) {
    providerSiret = normalizeSiret(hints.aiProviderSiret);
    reasoning.push("Rôle prestataire confirmé par analyse intelligente du document.");
  }
  if (hints.aiClientSiret && normalizeSiret(hints.aiClientSiret)) {
    clientSiret = normalizeSiret(hints.aiClientSiret);
    reasoning.push("Rôle client confirmé par analyse intelligente du document.");
  }

  reasoning.push(
    `${validCandidates.length} SIRET valides — prestataire et client identifiés via registre et contexte.`,
  );

  return {
    providerSiret,
    clientSiret: clientSiret !== providerSiret ? clientSiret : null,
    providerVerification: providerSiret ? verifications.get(providerSiret) ?? null : null,
    clientVerification:
      clientSiret && clientSiret !== providerSiret
        ? verifications.get(clientSiret) ?? null
        : null,
    invalidProviderCandidates: invalidNearLabel.map((c) => c.raw.trim()),
    confidence:
      bestProviderScore > 50 && bestClientScore > 30 ? "high" : "medium",
    reasoning,
  };
}
