#!/usr/bin/env node
/**
 * Génère des posts réseaux sociaux à partir des articles blog.
 * Usage: node marketing/scripts/generate-social-posts.js
 */

const posts = [
  {
    platform: "Facebook",
    text: `🏠 Vous allez signer un devis travaux ?

STOP. 73% des devis contiennent au moins 1 alerte (acompte abusif, SIRET manquant, prix gonflé).

RénovSûr analyse votre devis en 30 secondes — GRATUIT.

👉 Collez votre devis : https://renovsur.fr/analyser

#rénovation #travaux #propriétaire #arnaque`,
  },
  {
    platform: "LinkedIn",
    text: `Propriétaires : un mauvais devis travaux coûte en moyenne 1 850€ de trop-perçu.

Nous avons créé RénovSûr — la 1ère plateforme française d'analyse de devis BTP :
✓ Conformité légale (SIRET, TVA, décennale)
✓ Comparaison prix régionaux
✓ Détection patterns d'arnaque DGCCRF

Test gratuit : https://renovsur.fr/analyser`,
  },
  {
    platform: "Twitter/X",
    text: `Un devis travaux à 15k€ ?

Avant de signer vérifiez :
• SIRET valide
• Acompte ≤ 30%
• Prix au m² vs votre région

Analyse gratuite 👉 renovsur.fr/analyser`,
  },
  {
    platform: "TikTok (script)",
    text: `[HOOK] Ton artisan te demande 50% d'acompte ? C'est une arnaque classique.
[PROBLÈME] 2,4 milliards € d'arnaques travaux par an en France.
[SOLUTION] J'utilise RénovSûr — je colle mon devis, 30 sec, j'ai un score.
[CTA] Lien en bio — gratuit.`,
  },
];

console.log("=== Posts RénovSûr — à publier ===\n");
posts.forEach((p, i) => {
  console.log(`--- ${i + 1}. ${p.platform} ---\n`);
  console.log(p.text);
  console.log("\n");
});

console.log("Conseil : publiez 1 post/jour, alternez plateformes.");
console.log("Mesurez les clics avec UTM : ?utm_source=facebook&utm_medium=social");
