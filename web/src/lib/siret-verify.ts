/** Résultat de vérification via l'API publique Recherche d'entreprises (data.gouv.fr) */
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
    };
    matching_etablissements?: Array<{
      siret?: string;
      adresse?: string;
      etat_administratif?: string;
      activite_principale?: string;
      est_siege?: boolean;
    }>;
  }>;
}

const API_BASE = "https://recherche-entreprises.api.gouv.fr/search";
const TIMEOUT_MS = 8000;

/** Extrait et valide le format SIRET (14 chiffres + clé Luhn) */
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
    "43.32A": "Travaux de menuiserie bois",
    "43.33Z": "Travaux de revêtement des sols et des murs",
    "43.34Z": "Travaux de peinture et vitrerie",
    "43.91A": "Travaux de couverture",
    "43.99C": "Travaux de maçonnerie générale",
  };
  return labels[code] ?? `Activité NAF ${code}`;
}

export async function verifySiret(rawSiret: string): Promise<SiretVerification> {
  const siret = normalizeSiret(rawSiret);
  const verifiedAt = new Date().toISOString();

  if (!siret) {
    return {
      siret: rawSiret.replace(/\D/g, "").slice(0, 14) || rawSiret,
      status: "invalid",
      isActive: false,
      verifiedAt,
      registryUrl: "",
      summary: "Numéro SIRET invalide (14 chiffres + clé de contrôle).",
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
      return unavailable(siret, verifiedAt);
    }

    const data = (await res.json()) as ApiSearchResponse;
    const match = findEstablishment(data, siret);

    if (!match) {
      return {
        siret,
        status: "not_found",
        isActive: false,
        verifiedAt,
        registryUrl: registryUrl(siret),
        summary: `SIRET ${formatSiret(siret)} introuvable au registre national (INSEE / RNE).`,
      };
    }

    const isActive = match.etat === "A";
    const activityCode = match.activityCode;

    return {
      siret,
      status: isActive ? "active" : "closed",
      companyName: match.companyName,
      address: match.address,
      activityCode,
      isHeadOffice: match.isHeadOffice,
      isActive,
      verifiedAt,
      registryUrl: registryUrl(siret),
      summary: isActive
        ? `${match.companyName ?? "Entreprise"} — établissement actif au registre.${activityCode ? ` Activité : ${nafLabel(activityCode)}.` : ""}`
        : `${match.companyName ?? "Entreprise"} — établissement fermé ou radié (état administratif : ${match.etat ?? "inactif"}).`,
    };
  } catch {
    return unavailable(siret, verifiedAt);
  }
}

function unavailable(siret: string, verifiedAt: string): SiretVerification {
  return {
    siret,
    status: "unavailable",
    isActive: false,
    verifiedAt,
    registryUrl: registryUrl(siret),
    summary:
      "Vérification registre temporairement indisponible. Contrôlez manuellement sur annuaire-entreprises.data.gouv.fr.",
  };
}

function findEstablishment(
  data: ApiSearchResponse,
  siret: string,
): {
  companyName: string;
  address?: string;
  etat?: string;
  activityCode?: string;
  isHeadOffice?: boolean;
} | null {
  for (const result of data.results ?? []) {
    const companyName = result.nom_complet ?? result.nom_raison_sociale ?? "Entreprise";

    if (result.siege?.siret === siret) {
      return {
        companyName,
        address: result.siege.adresse,
        etat: result.siege.etat_administratif ?? result.etat_administratif,
        activityCode: result.siege.activite_principale ?? result.activite_principale,
        isHeadOffice: result.siege.est_siege ?? true,
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
      };
    }
  }
  return null;
}
