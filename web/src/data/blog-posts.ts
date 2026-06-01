export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "acompte-30-pourcent-devis-travaux",
    title: "Acompte devis travaux : pourquoi ne jamais dépasser 30 %",
    excerpt:
      "La DGCCRF alerte sur les arnaques par acompte. Règles légales et bonnes pratiques de paiement.",
    date: "2026-05-28",
    readTime: "4 min",
    tags: ["acompte", "paiement", "arnaque"],
    content: `
Verser plus de 30 % d'acompte à un artisan est l'un des signaux d'alerte les plus documentés par la DGCCRF.

**Pourquoi 30 % ?** C'est le plafond recommandé par les associations de consommateurs et la pratique standard du BTP pour couvrir l'achat de matériaux sans exposer le client à une perte totale si l'artisan disparaît.

**Échelonnement recommandé :**
- 30 % à la commande (après signature du devis détaillé)
- 40 % à mi-chantier (après validation des travaux intermédiaires)
- 30 % à réception (après levée des réserves éventuelles)

**Si l'artisan refuse :** C'est un motif légitime de ne pas signer. Un professionnel sérieux accepte un paiement lié à l'avancement.

Analysez votre devis gratuitement sur RénovSûr pour vérifier l'acompte et les autres points critiques.
    `.trim(),
  },
  {
    slug: "comment-verifier-devis-travaux",
    title: "Comment vérifier un devis travaux avant de signer (checklist 2026)",
    excerpt:
      "SIRET, TVA, décennale, acompte… Les 8 points obligatoires sur tout devis BTP en France.",
    date: "2026-05-15",
    readTime: "6 min",
    tags: ["devis", "légal", "arnaque"],
    content: `
Un devis travaux en France doit respecter des mentions obligatoires depuis la réforme de 2022. Avant de signer, vérifiez systématiquement :

**1. Le numéro SIRET** — 14 chiffres. Vérifiez-le sur societe.com : l'entreprise existe-t-elle ? Est-elle active ?

**2. La durée de validité** — Un devis sans date de validité peut être contesté. Standard : 1 à 3 mois.

**3. Le taux de TVA** — 20% pour la plupart des travaux, 10% pour certaines rénovations énergétiques, 5,5% pour l'amélioration énergétique sous conditions.

**4. L'assurance décennale** — Obligatoire pour tout travail affectant la structure. Demandez le numéro de police.

**5. L'acompte** — Ne dépassez jamais 30% à la signature. Au-delà, c'est un signal d'alerte documenté par la DGCCRF.

**6. Le détail des postes** — Chaque ligne doit préciser quantité, prix unitaire, matériaux.

**7. Les coordonnées complètes** — Adresse du chantier, nom de l'artisan, téléphone.

**8. Le montant total TTC** — Clair et sans ambiguïté.

RénovSûr automatise cette checklist en 30 secondes. Collez votre devis et obtenez un score de fiabilité gratuit.
    `.trim(),
  },
  {
    slug: "arnaques-travaux-domicile-2026",
    title: "Arnaques aux travaux : les 5 techniques les plus utilisées en 2026",
    excerpt:
      "Démarchage, acomptes abusifs, devis flous… Comment les repérer et vous protéger.",
    date: "2026-05-01",
    readTime: "8 min",
    tags: ["arnaque", "DGCCRF", "protection"],
    content: `
La Direction générale de la Concurrence signale chaque année des milliers de plaintes liées aux travaux à domicile. Voici les 5 schémas les plus fréquents :

**Le démarchage à domicile** — Un artisan frappe à votre porte après une tempête ou une rumeur de « subventions ». Vous avez 14 jours de rétractation si vous signez chez vous, mais le mieux est de refuser sur-le-champ.

**L'acompte de 50% ou plus** — L'artisan encaisse puis disparaît. Plafond recommandé : 30%.

**Le devis « trop beau »** — Prix 40% sous le marché pour vous faire signer, puis suppléments en cours de chantier.

**Le forfait global flou** — Un seul montant sans détail. Impossible de comparer ou négocier.

**Le paiement cash sans facture** — Vous perdez tout recours juridique.

Analysez chaque devis avec un outil objectif avant de vous engager. Un rapport à 19€ peut vous éviter des milliers d'euros de pertes.
    `.trim(),
  },
  {
    slug: "prix-moyen-renovation-par-region",
    title: "Prix moyens rénovation par région en France (2026)",
    excerpt:
      "Île-de-France, PACA, Occitanie… Combien coûtent peinture, carrelage, plomberie au m² ?",
    date: "2026-04-20",
    readTime: "5 min",
    tags: ["prix", "marché", "région"],
    content: `
Les prix des travaux varient fortement selon les régions. Voici les fourchettes moyennes constatées en 2026 :

| Travaux | Prix moyen national | Île-de-France |
|---------|---------------------|---------------|
| Peinture | 25-35 €/m² | 32-45 €/m² |
| Carrelage posé | 40-55 €/m² | 50-70 €/m² |
| Isolation combles | 50-80 €/m² | 65-100 €/m² |
| Plomberie salle de bain | 800-1500 € | 1000-2000 € |

Si votre devis dépasse ces fourchettes de plus de 25%, demandez une justification écrite ou un second avis.

RénovSûr compare automatiquement votre devis aux benchmarks régionaux.
    `.trim(),
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
