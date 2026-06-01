# Sécurité & monétisation — RénovSûr

## Failles corrigées

| Faille | Risque | Correction |
|--------|--------|------------|
| `?unlocked=complete` dans l'URL | Paiement contourné | Supprimé — déblocage uniquement via Stripe vérifié |
| `?success=1` sans paiement | Paiement contourné | Supprimé — vérification `session_id` Stripe côté serveur |
| Checkout sans Stripe en prod | Rapports gratuits illimités | Erreur 503 sauf `DEMO_MODE=true` en local |
| 15 analyses/heure | Abus API | Quota métier : **1 gratuit/semaine**, **2/mois** (IP + cookie appareil) |
| 3 alertes complètes en gratuit | Pas besoin de payer | Aperçu masqué : titres génériques, pas de recommandations réelles |
| Checklist légale détaillée gratuite | Valeur donnée gratis | Labels flous + « détail dans rapport payant » |
| Économies chiffrées gratuites | Levier de conversion perdu | Montant masqué jusqu'au paiement |
| Même devis re-soumis | Rapports gratuits multiples | Hash du devis → 409 + lien rapport existant |

## Modèle économique actuel

```
Aperçu GRATUIT (1×/semaine/appareil)
├── Score /100 + libellé
├── Compteurs : X critiques, Y vigilance, Z % légal
├── Alertes : titres masqués « Débloquer pour lire »
└── Pas de : prix marché, lettre, économies €, texte du devis

Rapport PAYANT (19 € ou 39 €)
├── Toutes les alertes détaillées
├── Comparaison prix régionaux
├── Checklist légale complète
├── Lettre de négociation (pack 39 €)
└── Économies potentielles chiffrées
```

## Pourquoi pas 100 % payant dès le début ?

Un aperçu limité convertit mieux qu'un mur payant immédiat :
- L'utilisateur voit qu'il y a **2 alertes critiques** → curiosité → paiement
- SEO et bouche-à-oreille : « j'ai testé gratuit, j'ai payé pour le détail »
- 1/semaine évite l'abus tout en laissant tester le produit

## Production obligatoire

```env
DEMO_MODE=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://renovsur.fr
```

## Limites actuelles (à scaler plus tard)

- Quotas en fichier JSON → migrer Redis/DB multi-serveur
- Rate limit en mémoire → idem
- Pas de CAPTCHA → ajouter hCaptcha si abus
