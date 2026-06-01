import type { Alert, QuoteInput } from "../types";

const SCAM_PATTERNS: {
  pattern: RegExp;
  title: string;
  description: string;
  recommendation: string;
  severity: Alert["severity"];
}[] = [
  {
    pattern: /esp[èe]ces\s+uniquement|cash\s+only|sans\s+facture/i,
    title: "Paiement en espèces sans facture",
    description:
      "Demander un paiement cash sans facture est illégal et vous prive de toute protection juridique.",
    recommendation:
      "Refusez. Exigez une facture et payez par virement ou chèque pour une trace écrite.",
    severity: "critical",
  },
  {
    pattern: /urgent|dernier\s+jour|offre\s+limit[ée]e|prix\s+valable\s+24/i,
    title: "Pression commerciale excessive",
    description:
      "Les arnaques classiques utilisent l'urgence pour empêcher la réflexion et la comparaison.",
    recommendation:
      "Prenez minimum 48h pour comparer 3 devis. Un artisan sérieux ne vous presse pas.",
    severity: "warning",
  },
  {
    pattern: /d[ée]barras|d[ée]marchage|passage\s+port[eé]\s+[àa]\s+port/i,
    title: "Origine démarchage à domicile",
    description:
      "Le démarchage à domicile est la source n°1 des arnaques aux travaux en France (DGCCRF).",
    recommendation:
      "Délai de rétractation de 14 jours si signature chez vous. Méfiez-vous des offres non sollicitées.",
    severity: "critical",
  },
  {
    pattern: /forfait\s+tout\s+compris\s+sans\s+d[ée]tail|prix\s+global\s+unique/i,
    title: "Forfait global sans décomposition",
    description:
      "Un montant unique sans détail des postes empêche toute vérification et négociation.",
    recommendation:
      "Exigez un devis détaillé poste par poste avec quantités et prix unitaires.",
    severity: "warning",
  },
  {
    pattern: /sous.?traitance\s+non\s+mentionn/i,
    title: "Sous-traitance non déclarée",
    description:
      "Si l'artisan sous-traite sans le mentionner, vous ne savez pas qui intervient chez vous.",
    recommendation:
      "Demandez par écrit qui réalisera les travaux et vérifiez leurs assurances.",
    severity: "warning",
  },
  {
    pattern: /subvention|prime\s+renov|maprimerenov|cee\s+offert/i,
    title: "Promesse de subvention non conditionnée",
    description:
      "Les arnaques utilisent des « aides » fictives pour faire signer vite sans vérifier l'éligibilité réelle.",
    recommendation:
      "Vérifiez votre éligibilité sur France Rénov' (france-renov.gouv.fr) indépendamment de l'artisan.",
    severity: "warning",
  },
  {
    pattern: /sans\s+devis|prix\s+verbal|devis\s+oral/i,
    title: "Absence de devis écrit",
    description:
      "Sans devis écrit signé, vous n'avez aucune base contractuelle en cas de litige.",
    recommendation:
      "Exigez un devis écrit détaillé avant tout versement, même partiel.",
    severity: "critical",
  },
  {
    pattern: /auto.?entrepreneur\s+sans\s+assurance|pas\s+d.?assurance/i,
    title: "Absence d'assurance mentionnée",
    description:
      "Travaux sans couverture assurance = risque financier total pour vous en cas de sinistre.",
    recommendation:
      "Exigez l'attestation d'assurance décennale et responsabilité civile à jour.",
    severity: "critical",
  },
];

export function detectScamPatterns(input: QuoteInput): Alert[] {
  const text = input.quoteText;
  const alerts: Alert[] = [];

  for (const scam of SCAM_PATTERNS) {
    if (scam.pattern.test(text)) {
      alerts.push({
        id: `scam-${alerts.length}`,
        severity: scam.severity,
        title: scam.title,
        description: scam.description,
        recommendation: scam.recommendation,
      });
    }
  }

  if (input.totalAmount > 0 && input.totalAmount < 500 && text.length > 500) {
    alerts.push({
      id: "scam-low-total",
      severity: "warning",
      title: "Montant anormalement bas",
      description:
        "Un devis détaillé avec un montant très bas cache souvent des suppléments en cours de chantier.",
      recommendation:
        "Demandez un devis ferme et définitif. Méfiez-vous des 'appâts' à prix cassé.",
      savingsEstimate: Math.round(input.totalAmount * 0.4),
    });
  }

  if (input.depositPercent && input.depositPercent > 30) {
    alerts.push({
      id: "scam-deposit",
      severity: input.depositPercent > 50 ? "critical" : "warning",
      title:
        input.depositPercent > 50
          ? "Acompte supérieur à 50%"
          : "Acompte supérieur à 30%",
      description:
        input.depositPercent > 50
          ? "La DGCCRF signale régulièrement des artisans qui encaissent un acompte élevé puis disparaissent."
          : `Un acompte de ${input.depositPercent}% dépasse la limite recommandée de 30%.`,
      recommendation:
        "Proposez 30 % maximum à la commande, puis le solde par étapes (mi-chantier, réception). Baisser l'acompte ne réduit pas le prix total : vous payez le reste plus tard.",
    });
  }

  return alerts;
}

/** @deprecated Utiliser generateNegotiationAdvice + buildNegotiationLetter */
export function generateNegotiationPoints(input: QuoteInput): string[] {
  return [
    "Comparez au moins 3 devis avant signature.",
    ...(input.depositPercent && input.depositPercent > 30
      ? [`Négociez l'acompte (actuellement ${input.depositPercent} %).`]
      : []),
  ];
}
