import type { QuoteInput } from "../types";

export interface LegalCheck {
  label: string;
  passed: boolean;
  detail: string;
  weight: number;
}

export function runLegalChecks(input: QuoteInput): LegalCheck[] {
  const text = input.quoteText.toLowerCase();
  const checks: LegalCheck[] = [];

  const hasSiret =
    Boolean(input.siret && /^\d{14}$/.test(input.siret.replace(/\s/g, ""))) ||
    /\b\d{3}\s?\d{3}\s?\d{3}\s?\d{5}\b/.test(input.quoteText);
  checks.push({
    label: "Numéro SIRET de l'artisan",
    passed: hasSiret,
    detail: hasSiret
      ? "SIRET identifié — vous pouvez vérifier l'entreprise sur societe.com ou Infogreffe."
      : "Obligatoire depuis 2022. Sans SIRET, le devis n'est pas valable légalement.",
    weight: 15,
  });

  const hasValidity =
    input.validityDays !== undefined ||
    /validit[ée].{0,20}(\d+)\s*(jours?|mois)/i.test(input.quoteText) ||
    /valable.{0,20}(\d+)\s*(jours?|mois)/i.test(input.quoteText);
  checks.push({
    label: "Durée de validité du devis",
    passed: Boolean(hasValidity),
    detail: hasValidity
      ? "Durée de validité mentionnée."
      : "Un devis doit indiquer sa durée de validité (généralement 1 à 3 mois).",
    weight: 10,
  });

  const hasTva =
    /tva|t\.v\.a/i.test(input.quoteText) ||
    /20\s*%|10\s*%|5\.?5\s*%/.test(input.quoteText);
  checks.push({
    label: "Mention TVA et taux applicable",
    passed: hasTva,
    detail: hasTva
      ? "TVA mentionnée sur le devis."
      : "Le taux de TVA (20%, 10% ou 5,5% selon les travaux) doit figurer explicitement.",
    weight: 10,
  });

  const hasDecennale =
    input.hasDecennale ||
    /d[ée]cennale|assurance.{0,30}responsabilit/i.test(text);
  checks.push({
    label: "Assurance décennale",
    passed: Boolean(hasDecennale),
    detail: hasDecennale
      ? "Mention d'assurance décennale détectée."
      : "Pour les travaux structurels, l'assurance décennale est obligatoire. Exigez le numéro de police.",
    weight: 20,
  });

  const deposit = input.depositPercent ?? extractDeposit(text);
  const depositOk = deposit === undefined || deposit <= 30;
  checks.push({
    label: "Acompte raisonnable (≤ 30%)",
    passed: depositOk,
    detail:
      deposit === undefined
        ? "Aucun acompte mentionné — vérifiez les conditions de paiement."
        : depositOk
          ? `Acompte de ${deposit}% — conforme aux recommandations.`
          : `Acompte de ${deposit}% — au-delà de 30%, c'est un signal d'alerte majeur.`,
    weight: 15,
  });

  const hasDescription = input.lines.length >= 2 || input.quoteText.length > 200;
  checks.push({
    label: "Description détaillée des prestations",
    passed: hasDescription,
    detail: hasDescription
      ? "Le devis contient un niveau de détail acceptable."
      : "Devis trop vague. Chaque poste doit préciser matériaux, quantités et main d'œuvre.",
    weight: 10,
  });

  const hasTotal = input.totalAmount > 0;
  checks.push({
    label: "Montant total TTC",
    passed: hasTotal,
    detail: hasTotal
      ? `Total TTC : ${input.totalAmount.toLocaleString("fr-FR")} €`
      : "Le montant total TTC doit être clairement indiqué.",
    weight: 10,
  });

  const hasAddress =
    /adresse|situ[ée].{0,10}(?:à|a)|lieu/i.test(input.quoteText) ||
    Boolean(input.artisanName);
  checks.push({
    label: "Coordonnées complètes",
    passed: hasAddress,
    detail: hasAddress
      ? "Coordonnées ou adresse des travaux mentionnées."
      : "Le devis doit mentionner l'adresse du chantier et les coordonnées de l'artisan.",
    weight: 10,
  });

  const hasRge =
    /rge|reconnu\s+garant|qualibat|qualifelec/i.test(text);
  const needsRge = /isolation|pompe|chaudière|photovoltaïque|maprimerenov/i.test(text);
  if (needsRge) {
    checks.push({
      label: "Label RGE (travaux énergétiques)",
      passed: hasRge,
      detail: hasRge
        ? "Artisan RGE identifié — nécessaire pour MaPrimeRénov' et CEE."
        : "Pour les aides à la rénovation énergétique, l'artisan doit être certifié RGE.",
      weight: 12,
    });
  }

  const hasPenalties = /p[ée]nalit[ée]|retard|d[ée]lai/i.test(text);
  checks.push({
    label: "Clause de délai / pénalités",
    passed: hasPenalties,
    detail: hasPenalties
      ? "Mention de délais ou pénalités détectée."
      : "Recommandé : fixer un délai d'exécution et des pénalités de retard par écrit.",
    weight: 5,
  });

  return checks;
}

function extractDeposit(text: string): number | undefined {
  const match = text.match(/acompte.{0,30}(\d+)\s*%/i);
  return match ? parseInt(match[1], 10) : undefined;
}

export function computeLegalScore(checks: LegalCheck[]): number {
  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.filter((c) => c.passed).reduce((s, c) => s + c.weight, 0);
  return Math.round((earned / totalWeight) * 100);
}
