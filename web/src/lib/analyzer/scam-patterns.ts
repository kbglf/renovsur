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

  if (input.depositPercent && input.depositPercent > 50) {
    alerts.push({
      id: "scam-deposit",
      severity: "critical",
      title: "Acompte supérieur à 50%",
      description:
        "La DGCCRF signale régulièrement des artisans qui encaissent puis disparaissent.",
      recommendation:
        "Ne versez jamais plus de 30% d'acompte. Échelonnez le reste à l'avancement des travaux.",
      savingsEstimate: Math.min(
        Math.round(input.totalAmount * ((input.depositPercent - 30) / 100)),
        input.totalAmount,
      ),
    });
  }

  return alerts;
}

export function generateNegotiationPoints(input: QuoteInput): string[] {
  const points: string[] = [];

  if (!input.siret) {
    points.push(
      "Demandez le SIRET et vérifiez-le sur le registre du commerce avant signature.",
    );
  }

  if (input.depositPercent && input.depositPercent > 30) {
    points.push(
      `Négociez l'acompte à 30% maximum (actuellement ${input.depositPercent}%).`,
    );
  }

  points.push(
    "Demandez 3 devis comparables et utilisez le moins cher comme levier de négociation.",
  );
  points.push(
    "Exigez que les matériaux soient détaillés (marque, référence) pour éviter les substitutions.",
  );
  points.push(
    "Proposez un échelonnement : 30% à la commande, 40% à mi-chantier, 30% à réception.",
  );
  points.push(
    "Incluez une clause de pénalité de retard (150€/semaine est standard dans le BTP).",
  );

  if (input.totalAmount > 5000) {
    points.push(
      "Pour un montant > 5 000€, faites appel à un architecte ou un assistant à maîtrise d'ouvrage (10€/m²).",
    );
  }

  return points;
}
