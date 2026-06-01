import type { Alert, AnalysisResult, QuoteInput } from "../types";
import { formatEuro } from "../utils";

function extractArtisanName(input: QuoteInput): string {
  if (input.artisanName?.trim()) return input.artisanName.trim();
  const firstLine = input.quoteText.split("\n").find((l) => l.trim().length > 3);
  if (firstLine && firstLine.length < 80) return firstLine.trim();
  return "Madame, Monsieur";
}

function formatPercent(n: number): string {
  return `${n} %`;
}

/** Conseils pratiques pour le particulier (pas la lettre à l'artisan) */
export function generateNegotiationAdvice(
  input: QuoteInput,
  alerts: Alert[],
): string[] {
  const tips: string[] = [];

  tips.push(
    "Comparez au moins 3 devis du même périmètre avant de signer ou de verser un acompte.",
  );

  if (input.depositPercent && input.depositPercent > 30) {
    tips.push(
      `Ne payez pas plus de 30 % à la commande (votre devis indique ${input.depositPercent} %). Échelonnez le solde selon l'avancement.`,
    );
  }

  if (!input.siret) {
    tips.push(
      "Vérifiez le SIRET sur annuaire-entreprises.data.gouv.fr et refusez tout paiement si l'entreprise est inactive.",
    );
  }

  const priceAlerts = alerts.filter((a) => a.id.startsWith("price-"));
  if (priceAlerts.length > 0) {
    tips.push(
      "Utilisez les écarts de prix identifiés dans le rapport pour demander une justification écrite ou un devis concurrent.",
    );
  }

  tips.push(
    "Exigez le détail des matériaux (marque, référence) et une clause de délai avec pénalités de retard.",
  );

  if (input.totalAmount > 5000) {
    tips.push(
      "Pour un chantier important, un architecte ou un assistant à maîtrise d'ouvrage peut sécuriser le projet.",
    );
  }

  return tips;
}

/** Lettre formelle prête à envoyer à l'artisan */
export function buildNegotiationLetter(report: AnalysisResult): string {
  const { input, alerts, legalChecks } = report;
  const artisan = extractArtisanName(input);
  const salutation =
    artisan === "Madame, Monsieur"
      ? "Madame, Monsieur,"
      : `${artisan},`;

  const paragraphs: string[] = [];
  const issues: string[] = [];

  if (input.totalAmount > 0) {
    paragraphs.push(
      `Je me permets de vous écrire suite à réception de votre devis pour un montant de ${formatEuro(input.totalAmount)} TTC.`,
    );
  } else {
    paragraphs.push("Je me permets de vous écrire suite à réception de votre devis.");
  }

  if (input.depositPercent && input.depositPercent > 30) {
    const excess = Math.round(
      input.totalAmount * ((input.depositPercent - 30) / 100),
    );
    issues.push(
      `Votre devis prévoit un acompte de ${formatPercent(input.depositPercent)} à la commande. Je souhaite le ramener à 30 % maximum, conformément aux recommandations usuelles et à la réglementation en matière de protection des consommateurs${excess > 0 ? ` (écart estimé : ${formatEuro(excess)})` : ""}.`,
    );
  }

  const siretCheck = legalChecks.find((c) => c.label.includes("SIRET"));
  if (siretCheck && !siretCheck.passed) {
    issues.push(
      "Le numéro SIRET indiqué sur le devis ne nous permet pas de confirmer l'identité de l'entreprise au registre national. Merci de me communiquer un SIRET valide et une attestation d'immatriculation à jour.",
    );
  } else if (!input.siret) {
    issues.push(
      "Le devis ne comporte pas de numéro SIRET lisible. Merci de l'ajouter : il est obligatoire pour la validité du document.",
    );
  }

  const decennaleCheck = legalChecks.find((c) =>
    c.label.toLowerCase().includes("décennale"),
  );
  if (decennaleCheck && !decennaleCheck.passed) {
    issues.push(
      "Je n'ai pas identifié d'attestation d'assurance décennale clairement valable pour les travaux concernés. Merci de joindre une attestation en cours de validité précisant les activités couvertes.",
    );
  }

  const rgeCheck = legalChecks.find((c) => c.label.includes("RGE"));
  if (rgeCheck && !rgeCheck.passed) {
    issues.push(
      "Les travaux décrits semblent éligibles à des aides à la rénovation énergétique. Merci de confirmer votre qualification RGE ou de préciser pourquoi elle ne s'applique pas.",
    );
  }

  for (const alert of alerts.filter((a) => a.severity === "critical").slice(0, 4)) {
    if (alert.id === "scam-deposit" || alert.id.startsWith("siret")) continue;
    issues.push(`${alert.title} : ${alert.recommendation}`);
  }

  for (const alert of alerts.filter((a) => a.id.startsWith("price-")).slice(0, 3)) {
    issues.push(
      `${alert.title} — ${alert.description} Je vous demande une justification écrite ou un ajustement tarifaire.`,
    );
  }

  if (issues.length === 0) {
    issues.push(
      "Plusieurs postes méritent une clarification (détail des prestations, conditions de paiement, délais d'exécution).",
    );
  }

  const body =
    paragraphs.join("\n\n") +
    "\n\nAvant toute signature, je souhaite obtenir les précisions suivantes :\n\n" +
    issues.map((t, i) => `${i + 1}. ${t}`).join("\n\n") +
    "\n\nJe vous remercie de me transmettre un devis rectificé, daté et signé, sous quinze jours ouvrés à compter de la réception du présent courrier.\n\nDans l'attente de votre retour, je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.\n\n[Votre nom]\n[Votre adresse]\n[Votre téléphone]";

  return `Objet : Demande de révision du devis travaux\n\n${salutation}\n\n${body}`;
}
