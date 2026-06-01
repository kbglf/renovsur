# Checklist mise en ligne — RénovSûr

## Maintenant (vous + Vercel)

Le site est en ligne. **Prochaine étape : activer les paiements.**

1. Suivre **`STRIPE-RESEND-SETUP.md`** (guide détaillé Stripe + Resend + mentions légales)
2. Vérifier : `https://renovsur.vercel.app/api/health` → `readiness.launchReady: true`
3. Montrer le produit : **`/exemple-rapport`** (rapport fictif complet, sans payer)

---

## Étape 1 — Code sur GitHub (15 min) ✅

```bash
cd /Users/kglf/Desktop/Bureau/AppV1
git init
git add web marketing README.md PRE-LANCEMENT.md SECURITE-MONETISATION.md
git commit -m "RénovSûr — site prêt pour production"
```

Créer un dépôt sur GitHub et pousser (`git remote add origin …` puis `git push -u origin main`).

---

## Étape 2 — Vercel (20 min)

1. [vercel.com](https://vercel.com) → **Add New Project** → importer le repo
2. **Root Directory** : `web`
3. **Storage** → **Blob** → Create → lier au projet (génère `BLOB_READ_WRITE_TOKEN` automatiquement)
4. **Environment Variables** (Production) :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://renovsur.fr` (ou URL `.vercel.app` en test) |
| `STRIPE_SECRET_KEY` | `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` (après étape 3) |
| `AUTH_SECRET` | chaîne aléatoire 32+ caractères |
| `RESEND_API_KEY` | clé Resend |
| `EMAIL_FROM` | `RénovSûr <noreply@renovsur.fr>` |
| `LEGAL_COMPANY_NAME` | raison sociale |
| `LEGAL_SIRET` | SIRET |
| `LEGAL_ADDRESS` | adresse |
| `LEGAL_DIRECTOR` | nom |
| `DEMO_MODE` | `false` |

5. **Deploy** → noter l’URL `https://xxx.vercel.app`

---

## Étape 3 — Stripe live (15 min)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → activer le compte (KYC)
2. **Developers → API keys** → clé secrète live → `STRIPE_SECRET_KEY` sur Vercel
3. **Developers → Webhooks** → Add endpoint :
   - URL : `https://VOTRE-DOMAINE/api/webhook/stripe`
   - Événement : `checkout.session.completed`
4. Copier le secret → `STRIPE_WEBHOOK_SECRET` sur Vercel → **Redeploy**

**Test** : carte `4242 4242 4242 4242` en mode test d’abord, puis un vrai petit paiement en live.

---

## Étape 4 — Domaine & email (variable)

- Acheter `renovsur.fr` → Vercel → **Domains** → ajouter → DNS chez le registrar
- Resend : vérifier le domaine pour envoyer depuis `noreply@renovsur.fr`
- Rediriger `contact@renovsur.fr` vers ta boîte mail

---

## Étape 5 — Validation (10 min)

- [ ] `/api/health` répond OK
- [ ] Analyse gratuite (aperçu) → résultats
- [ ] Paiement 19 € → rapport débloqué + email reçu
- [ ] Pack 49 € → crédits visibles sur `/analyser`
- [ ] Connexion `/compte` avec le même email
- [ ] Google Search Console → soumettre `/sitemap.xml`

---

## Semaine 1 — Acquisition (gratuit)

Voir `marketing/GUIDE-PUB-GRATUITE.md` :

- 2 posts / semaine dans groupes Facebook rénovation
- `node marketing/scripts/generate-social-posts.js`
- 1 article blog / semaine

---

## Déjà intégré côté technique

- [x] 1 aperçu gratuit à vie / appareil
- [x] Paiement Stripe + webhook idempotent
- [x] Stockage persistant Vercel Blob (prod) / disque local (dev)
- [x] PDF, compte email, emails Resend
- [x] Pas de remboursement automatique (CGV)

## Plus tard

- App mobile (Expo) — dossier `mobile/`
- Analytics (Plausible) si besoin
