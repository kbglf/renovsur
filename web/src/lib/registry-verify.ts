import type { WorkType } from "./types";

/** Registre national + labels RGE (API data.gouv.fr) */
export type SiretVerificationStatus =
  | "active"
  | "closed"
  | "not_found"
  | "invalid"
  | "unavailable";

export interface SiretVerification {
  siret: string;
  status: SiretVerificationStatus;
  companyName?: string;
  address?: string;
  activityCode?: string;
  isHeadOffice?: boolean;
  isActive: boolean;
  verifiedAt: string;
  registryUrl: string;
  summary: string;
}

export type RgeVerificationStatus =
  | "certified"
  | "not_certified"
  | "not_required"
  | "unknown";

export interface RgeVerification {
  required: boolean;
  status: RgeVerificationStatus;
  certificationCodes: string[];
  summary: string;
  annuaireUrl: string;
}

export type DecennaleVerificationStatus =
  | "mentioned"
  | "missing"
  | "not_required"
  | "cannot_verify_online";

export interface DecennaleVerification {
  required: boolean;
  status: DecennaleVerificationStatus;
  mentionedInQuote: boolean;
  policyNumber?: string;
  insurerHint?: string;
  validityHint?: string;
  summary: string;
  guideUrl: string;
}

export interface CompanyRegistryBundle {
  siret: SiretVerification;
  rge: RgeVerification;
  decennale: DecennaleVerification;
}

interface EstablishmentMatch {
  companyName: string;
  address?: string;
  etat?: string;
  activityCode?: string;
  isHeadOffice?: boolean;
  rgeCodes: string[];
}

interface ApiSearchResponse {
  results?: Array<{
    nom_complet?: string;
    nom_raison_sociale?: string;
    etat_administratif?: string;
    activite_principale?: string;
    siege?: {
      siret?: string;
      adresse?: string;
      etat_administratif?: string;
      activite_principale?: string;
      est_siege?: boolean;
      liste_rge?: string[] | null;
    };
    matching_etablissements?: Array<{
      siret?: string;
      adresse?: string;
      etat_administratif?: string;
      activite_principale?: string;
      est_siege?: boolean;
      liste_rge?: string[] | null;
    }>;
  }>;
}

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const TIMEOUT_MS = 8000;
const FRANCE_RENOV_ANNUAIRE = "https://france-renov.gouv.fr/annuaire-professionnels";

const ENERGY_KEYWORDS =
  /isolation|pompe\s+à\s+chaleur|pompe\s+a\s+chaleur|chaudière|chaudiere|photovoltaïque|photovoltaique|maprimerénov|maprimerenov|rénovation\s+énergétique|renovation\s+energetique|cee\b|audit\s+énerg/i;

const DECENNALE_KEYWORDS =
  /gros\s+œuvre|gros\s+oeuvre|structure|charpente|toiture|couverture|maçonnerie|maconnerie|étanchéité|etancheite|fondation|dalle|mur\s+porteur/i;

const INSURER_HINTS = [
  "AXA",
  "ALLIANZ",
  "MAAF",
  "GROUPAMA",
  "MACIF",
  "MAIF",
  "GMF",
  "GENERALI",
  "SWISS LIFE",
  "SMACL",
  "MMA",
  "COVEA",
  "QBE",
  "SMABTP",
];

export function normalizeSiret(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 14 || !/^\d{14}$/.test(digits)) return null;
  if (!isValidSiretLuhn(digits)) return null;
  return digits;
}

function isValidSiretLuhn(siret: string): boolean {
  let sum = 0;
  for (let i = 0; i < siret.length; i++) {
    let digit = parseInt(siret[i], 10);
    if ((siret.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function formatSiret(siret: string): string {
  return `${siret.slice(0, 3)} ${siret.slice(3, 6)} ${siret.slice(6, 9)} ${siret.slice(9)}`;
}

function registryUrl(siret: string): string {
  return `https://annuaire-entreprises.data.gouv.fr/etablissement/${siret}`;
}

function nafLabel(code: string): string {
  const labels: Record<string, string> = {
    "43.21A": "Travaux d'installation électrique",
    "43.22A": "Travaux d'installation d'eau et de gaz",
    "43.29A": "Travaux d'isolation",
    "43.31Z": "Travaux de plâtrerie",
    "43.32A": "Travaux de menuiserie",
    "43.33Z": "Travaux de revêtement (carrelage)",
    "43.34Z": "Travaux de peinture",
    "43.91A": "Travaux de couverture / toiture",
    "43.99C": "Travaux de maçonnerie",
  };
  return labels[code] ?? `Activité NAF ${code}`;
}

export function needsRgeCheck(quoteText: string, workType: WorkType): boolean {
  if (ENERGY_KEYWORDS.test(quoteText)) return true;
  return ["isolation", "toiture", "menuiserie"].includes(workType);
}

export function needsDecennaleCheck(
  quoteText: string,
  workType: WorkType,
  totalAmount: number,
): boolean {
  if (workType === "peinture" && !DECENNALE_KEYWORDS.test(quoteText)) {
    return totalAmount > 8000;
  }
  if (DECENNALE_KEYWORDS.test(quoteText)) return true;
  return ["toiture", "maconnerie", "carrelage", "plomberie", "electricite", "isolation", "menuiserie"].includes(
    workType,
  );
}

function parseDecennaleFromQuote(quoteText: string): {
  mentioned: boolean;
  policyNumber?: string;
  insurerHint?: string;
  validityHint?: string;
} {
  const lower = quoteText.toLowerCase();
  const mentioned =
    /d[ée]cennale/i.test(quoteText) ||
    /assurance.{0,50}responsabilit[ée].{0,30}travaux/i.test(quoteText) ||
    /garantie.{0,30}travaux/i.test(quoteText);

  const policyMatch =
    quoteText.match(
      /(?:police|contrat|attestation).{0,15}(?:n[°o]|num[ée]ro)?\s*[:\s]*([A-Z0-9][A-Z0-9\-\/]{5,24})/i,
    ) ?? quoteText.match(/DEC[-\s]?([A-Z0-9\-\/]{6,20})/i);

  let insurerHint: string | undefined;
  for (const name of INSURER_HINTS) {
    if (quoteText.toUpperCase().includes(name)) {
      insurerHint = name;
      break;
    }
  }

  const validityMatch = quoteText.match(
    /valable\s+jusqu['']?au\s+(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i,
  );

  return {
    mentioned,
    policyNumber: policyMatch?.[1]?.trim(),
    insurerHint,
    validityHint: validityMatch?.[1],
  };
}

function buildDecennaleVerification(
  quoteText: string,
  workType: WorkType,
  totalAmount: number,
): DecennaleVerification {
  const required = needsDecennaleCheck(quoteText, workType, totalAmount);
  const parsed = parseDecennaleFromQuote(quoteText);

  if (!required) {
    return {
      required: false,
      status: "not_required",
      mentionedInQuote: parsed.mentioned,
      summary:
        "Pour ce type de travaux (ex. peinture seule), la décennale n'est pas toujours obligatoire — une assurance RC pro reste recommandée.",
      guideUrl: FRANCE_RENOV_ANNUAIRE,
    };
  }

  if (parsed.mentioned) {
    const parts = [
      "Mention d'assurance décennale (ou responsabilité travaux) détectée dans le devis.",
    ];
    if (parsed.policyNumber) parts.push(`Référence indiquée : ${parsed.policyNumber}.`);
    if (parsed.insurerHint) parts.push(`Assureur mentionné : ${parsed.insurerHint}.`);
    if (parsed.validityHint) parts.push(`Validité indiquée jusqu'au ${parsed.validityHint}.`);
    parts.push(
      "Aucune API publique ne permet de confirmer en ligne que la police est encore active : appelez l'assureur avec le numéro de contrat.",
    );

    return {
      required: true,
      status: "mentioned",
      mentionedInQuote: true,
      policyNumber: parsed.policyNumber,
      insurerHint: parsed.insurerHint,
      validityHint: parsed.validityHint,
      summary: parts.join(" "),
      guideUrl:
        "https://www.service-public.fr/particuliers/vosdroits/F35741",
    };
  }

  return {
    required: true,
    status: "missing",
    mentionedInQuote: false,
    summary:
      "Aucune assurance décennale clairement identifiée sur ce devis. Exigez une attestation en cours de validité, avec activités couvertes et dates, avant tout acompte.",
    guideUrl: "https://www.service-public.fr/particuliers/vosdroits/F35741",
  };
}

function buildRgeVerification(
  rgeCodes: string[],
  quoteText: string,
  workType: WorkType,
  siretActive: boolean,
): RgeVerification {
  const required = needsRgeCheck(quoteText, workType);
  const certified = rgeCodes.length > 0;

  if (!required) {
    return {
      required: false,
      status: "not_required",
      certificationCodes: rgeCodes,
      summary:
        "Travaux non orientés aides à la rénovation énergétique — le label RGE n'est pas requis pour ce devis.",
      annuaireUrl: FRANCE_RENOV_ANNUAIRE,
    };
  }

  if (!siretActive) {
    return {
      required: true,
      status: "unknown",
      certificationCodes: [],
      summary:
        "Impossible de croiser le label RGE tant que le SIRET n'est pas actif au registre.",
      annuaireUrl: FRANCE_RENOV_ANNUAIRE,
    };
  }

  if (certified) {
    return {
      required: true,
      status: "certified",
      certificationCodes: rgeCodes,
      summary: `Établissement référencé RGE au registre national (${rgeCodes.length} certification(s) : ${rgeCodes.slice(0, 3).join(", ")}${rgeCodes.length > 3 ? "…" : ""}). Nécessaire pour MaPrimeRénov' et CEE.`,
      annuaireUrl: FRANCE_RENOV_ANNUAIRE,
    };
  }

  return {
    required: true,
    status: "not_certified",
    certificationCodes: [],
    summary:
      "Aucun label RGE trouvé pour cet établissement au registre national. Pour des travaux éligibles aux aides, choisissez un artisan RGE.",
    annuaireUrl: FRANCE_RENOV_ANNUAIRE,
  };
}

export async function verifyCompanyRegistry(
  rawSiret: string,
  context: { quoteText: string; workType: WorkType; totalAmount: number },
): Promise<CompanyRegistryBundle> {
  const siret = normalizeSiret(rawSiret);
  const verifiedAt = new Date().toISOString();
  const decennale = buildDecennaleVerification(
    context.quoteText,
    context.workType,
    context.totalAmount,
  );

  if (!siret) {
    const invalidSiret: SiretVerification = {
      siret: rawSiret.replace(/\D/g, "").slice(0, 14) || rawSiret,
      status: "invalid",
      isActive: false,
      verifiedAt,
      registryUrl: "",
      summary: "Numéro SIRET invalide (14 chiffres + clé de contrôle).",
    };
    return {
      siret: invalidSiret,
      rge: buildRgeVerification([], context.quoteText, context.workType, false),
      decennale,
    };
  }

  try {
    const url = `${API_BASE}?q=${encodeURIComponent(siret)}&per_page=1`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      next: { revalidate: 86400 },
    });

    if (!res.ok) {
      const unavailableSiret: SiretVerification = {
        siret,
        status: "unavailable",
        isActive: false,
        verifiedAt,
        registryUrl: registryUrl(siret),
        summary:
          "Vérification registre temporairement indisponible. Contrôlez sur annuaire-entreprises.data.gouv.fr.",
      };
      return {
        siret: unavailableSiret,
        rge: buildRgeVerification([], context.quoteText, context.workType, false),
        decennale,
      };
    }

    const data = (await res.json()) as ApiSearchResponse;
    const match = findEstablishment(data, siret);

    if (!match) {
      const notFound: SiretVerification = {
        siret,
        status: "not_found",
        isActive: false,
        verifiedAt,
        registryUrl: registryUrl(siret),
        summary: `SIRET ${formatSiret(siret)} introuvable au registre national.`,
      };
      return {
        siret: notFound,
        rge: buildRgeVerification([], context.quoteText, context.workType, false),
        decennale,
      };
    }

    const isActive = match.etat === "A";
    const siretResult: SiretVerification = {
      siret,
      status: isActive ? "active" : "closed",
      companyName: match.companyName,
      address: match.address,
      activityCode: match.activityCode,
      isHeadOffice: match.isHeadOffice,
      isActive,
      verifiedAt,
      registryUrl: registryUrl(siret),
      summary: isActive
        ? `${match.companyName} — établissement actif.${match.activityCode ? ` Activité : ${nafLabel(match.activityCode)}.` : ""}`
        : `${match.companyName} — établissement fermé ou radié.`,
    };

    return {
      siret: siretResult,
      rge: buildRgeVerification(
        match.rgeCodes,
        context.quoteText,
        context.workType,
        isActive,
      ),
      decennale,
    };
  } catch {
    const unavailableSiret: SiretVerification = {
      siret,
      status: "unavailable",
      isActive: false,
      verifiedAt,
      registryUrl: registryUrl(siret),
      summary: "Vérification registre temporairement indisponible.",
    };
    return {
      siret: unavailableSiret,
      rge: buildRgeVerification([], context.quoteText, context.workType, false),
      decennale,
    };
  }
}

function findEstablishment(data: ApiSearchResponse, siret: string): EstablishmentMatch | null {
  for (const result of data.results ?? []) {
    const companyName = result.nom_complet ?? result.nom_raison_sociale ?? "Entreprise";

    if (result.siege?.siret === siret) {
      return {
        companyName,
        address: result.siege.adresse,
        etat: result.siege.etat_administratif ?? result.etat_administratif,
        activityCode: result.siege.activite_principale ?? result.activite_principale,
        isHeadOffice: result.siege.est_siege ?? true,
        rgeCodes: result.siege.liste_rge ?? [],
      };
    }

    const etab = result.matching_etablissements?.find((e) => e.siret === siret);
    if (etab) {
      return {
        companyName,
        address: etab.adresse,
        etat: etab.etat_administratif ?? result.etat_administratif,
        activityCode: etab.activite_principale ?? result.activite_principale,
        isHeadOffice: etab.est_siege,
        rgeCodes: etab.liste_rge ?? [],
      };
    }
  }
  return null;
}

/** Rétrocompatibilité */
export async function verifySiret(rawSiret: string): Promise<SiretVerification> {
  const bundle = await verifyCompanyRegistry(rawSiret, {
    quoteText: "",
    workType: "autre",
    totalAmount: 0,
  });
  return bundle.siret;
}
