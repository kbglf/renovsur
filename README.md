# RénovSûr — Analyse de devis travaux

Plateforme complète (web + mobile) pour analyser les devis BTP avant signature.

## Concept

**RénovSûr** est la 1ère plateforme française spécialisée dans l'analyse de devis travaux :
- Détection d'arnaques (patterns DGCCRF)
- Vérification légale (SIRET, TVA, décennale, acompte)
- Comparaison prix vs marché régional
- Lettre de négociation (pack premium)

**Modèle économique :** freemium → Rapport Complet 19€ / Pack Négociation 39€

## Structure

```
AppV1/
├── web/          # Site Next.js 16
├── mobile/       # App Expo React Native
└── marketing/    # Guide pub gratuite + scripts
```

## Démarrage rapide

### Site web

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

Ouvrir http://localhost:3000

### App mobile

```bash
cd mobile
npm install
# Configurer l'URL API dans mobile/src/config.ts
npm start
```

### Paiements Stripe (production)

1. Créer compte sur https://stripe.com
2. Copier les clés dans `web/.env.local`
3. Configurer webhook : `POST /api/webhook/stripe`
4. Sans Stripe : mode démo débloque les rapports automatiquement

## Déploiement

**Web :** Vercel (recommandé)
```bash
cd web && vercel
```

**Mobile :** EAS Build
```bash
cd mobile && npx eas build --platform all
```

## Marketing gratuit

Voir `marketing/GUIDE-PUB-GRATUITE.md`

Générer des posts :
```bash
node marketing/scripts/generate-social-posts.js
```

## Monétisation & anti-abus

- **1 aperçu gratuit / semaine** (cookie appareil + IP), max 2/mois
- Gratuit = score + compteurs d'alertes, **pas le détail** (recommandations, prix, lettre)
- Paiement **Stripe vérifié** uniquement (failles `?unlocked=` supprimées)
- Voir `SECURITE-MONETISATION.md` pour le détail

## Améliorations pré-lancement (intégrées)

- Rate limiting, sanitization, headers sécurité, FAQ, contact, cookies RGPD
- Checklist : `PRE-LANCEMENT.md`

## Prochaines étapes

Voir **`PRE-LANCEMENT.md`** pour la checklist complète avant mise en ligne.
