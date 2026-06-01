# Guide pub ciblée gratuite — RénovSûr

## Positionnement

**Cible :** propriétaires français 35-65 ans, projet rénovation 5 000–50 000 €, avant signature de devis.

**Message :** « Ne signez pas un devis sans l'avoir analysé — 30 sec, gratuit. »

**Différenciation :** pas un comparateur de devis, pas un chatbot juridique — analyse anti-arnaque + prix régionaux + conformité légale BTP.

---

## Canaux gratuits (ordre de priorité)

### 1. SEO (déjà intégré au site)

- Articles blog : `/blog` (3 articles seed, en ajouter 2/semaine)
- Mots-clés longue traîne :
  - « comment vérifier un devis travaux »
  - « arnaque artisan rénovation »
  - « prix peinture m2 [région] »
  - « acompte devis travaux légal »
- Soumettre sitemap : Google Search Console → `https://votre-domaine.fr/sitemap.xml`

### 2. Groupes Facebook (ciblage fort)

Rejoindre et poster **valeur d'abord** (pas de spam direct) :

- « Rénovation maison France »
- « Propriétaires bailleurs France »
- Groupes locaux « Entraide [ville] »
- « MaPrimeRénov / rénovation énergétique »

**Modèle de post :**

> Je viens de recevoir un devis à 12 000 € pour ma salle de bain. Avant de signer, j'ai testé un outil gratuit qui vérifie SIRET, acompte et prix au m² dans ma région. Résultat : 2 alertes rouges. Si ça peut aider d'autres : [lien /analyser]

### 3. Reddit / forums

- r/france, r/vosfinances, r/immobilier
- Forum-Juridique.net (section location/travaux)
- Bulle-Immobilier.com

### 4. TikTok / Reels (organique)

Formats qui convertissent :

- « 3 signes qu'un devis travaux est une arnaque »
- « J'ai analysé un devis à 15 000 € — voici ce qui cloche »
- « Pourquoi ne jamais payer plus de 30 % d'acompte »

Script court : problème → démo écran → CTA lien bio.

### 5. Partenariats micro-influenceurs

Proposer **commission 30 %** sur chaque vente (Stripe affiliate ou code promo manuel).

Cibles : chaînes YouTube « rénovation maison », comptes Instagram artisans/déco.

### 6. Réponses Quora / Google Questions

Chercher : « comment savoir si un devis est cher », « arnaque travaux que faire ».

Réponse utile 300 mots + lien discret en fin.

### 7. Product Hunt / BetaList (lancement)

Préparer : tagline, 3 screenshots, démo vidéo 60 sec.

---

## Scripts automatisables

```bash
# Générer des posts réseaux sociaux depuis le blog
node marketing/scripts/generate-social-posts.js

# Vérifier SEO technique
cd web && npm run build

# Checklist complète avant lancement
cat PRE-LANCEMENT.md
```

## Pages à mettre en avant

| URL | Usage pub |
|-----|-----------|
| `/analyser` | CTA principal — analyse gratuite |
| `/blog/acompte-30-pourcent-devis-travaux` | Article viral Facebook |
| `/faq` | Répondre aux objections |
| `/tarifs` | Conversion payante |

---

## KPI semaine 1

| Métrique | Objectif |
|----------|----------|
| Analyses gratuites | 50 |
| Taux conversion payant | 5–8 % |
| Revenu | 50–100 € |
| Articles blog | +2 |

---

## Budget pub payante (plus tard)

Quand SEO + organique > 20 ventes/mois :

- Google Ads : mots-clés « analyse devis travaux » (CPC ~1–2 €)
- Meta Ads : propriétaires 40+, intérêts rénovation
- CAC cible < 8 € pour panier moyen 25 €

---

## Conformité pub

- Ne pas promettre « économies garanties »
- Mentionner « analyse indicative »
- RGPD : pas de remarketing sans consentement bannière cookies
