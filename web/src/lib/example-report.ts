import { analyzeQuote } from "./analyzer";
import { SAMPLE_QUOTE } from "./constants";
import type { AnalysisResult } from "./types";

export const EXAMPLE_REPORT_ID = "eeee0000-0000-4000-8000-000000000001";

/** Rapport fictif complet (démonstration marketing — pas stocké en base) */
export function getExampleReport(): AnalysisResult {
  const report = analyzeQuote({
    quoteText: SAMPLE_QUOTE,
    region: "ile-de-france",
    surfaceM2: 35,
    depositPercent: 45,
    hasDecennale: true,
    validityDays: 60,
  });

  report.id = EXAMPLE_REPORT_ID;
  report.createdAt = "2026-01-15T10:00:00.000Z";
  report.isPaid = true;
  report.plan = "negotiation";
  report.email = undefined;

  report.siretVerification = {
    siret: "12345678900012",
    status: "invalid",
    isActive: false,
    verifiedAt: report.createdAt,
    registryUrl: "",
    summary:
      "Numéro SIRET invalide (exemple fictif) — en situation réelle, un SIRET valide est vérifié au registre national.",
  };

  report.rgeVerification = {
    required: false,
    status: "not_required",
    certificationCodes: [],
    summary:
      "Travaux de peinture — le label RGE n'est pas requis pour ce type de chantier.",
    annuaireUrl: "https://france-renov.gouv.fr/annuaire-professionnels",
  };

  report.decennaleVerification = {
    required: true,
    status: "mentioned",
    mentionedInQuote: true,
    policyNumber: "DEC-2024-88921",
    summary:
      "Mention d'assurance décennale détectée dans le devis (exemple). En réel : confirmez auprès de l'assureur que la police est active.",
    guideUrl: "https://www.service-public.fr/particuliers/vosdroits/F35741",
  };

  return report;
}
