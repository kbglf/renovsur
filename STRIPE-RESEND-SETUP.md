# Stripe + Resend — guide pas à pas (30–45 min)

Site : **https://renovsur.vercel.app** (ou votre domaine)

Vérifiez l’état : `https://renovsur.vercel.app/api/health` → champ `readiness.launchReady` doit passer à `true`.

---

## Partie A — Stripe (paiements)

### 1. Compte Stripe

1. Allez sur [dashboard.stripe.com](https://dashboard.stripe.com)
2. Complétez l’activation du compte (identité, IBAN) si ce n’est pas fait
3. Passez en **mode Live** (interrupteur en haut à droite)

### 2. Clé API

1. **Developers → API keys**
2. Copiez la **Secret key** (`sk_live_…`)
3. Vercel → projet RénovSûr → **Settings → Environment Variables**
4. Ajoutez `STRIPE_SECRET_KEY` = `sk_live_…` (Production)
5. **Save**

### 3. Webhook (obligatoire pour débloquer les rapports après paiement)

1. Stripe → **Developers → Webhooks** → **Add endpoint**
2. **Endpoint URL** :
   ```
   https://renovsur.vercel.app/api/webhook/stripe
   ```
   (remplacez par `https://renovsur.fr` si vous avez le domaine)
3. **Events** : cochez uniquement `checkout.session.completed`
4. Créez → copiez le **Signing secret** (`whsec_…`)
5. Vercel → `STRIPE_WEBHOOK_SECRET` = `whsec_…` (Production)
6. **Deployments → Redeploy** (dernier déploiement)

### 4. Test

**Mode test d’abord** (optionnel) : utilisez `sk_test_…` et une URL webhook de test.

**Mode live** :

1. Allez sur `/analyser` → analyse gratuite → page résultats
2. Payez **19 €** avec une vraie carte (ou carte test si encore en test)
3. Vous devez revenir sur le rapport **débloqué** (`?paid=1`)
4. Vérifiez **Stripe → Payments** : paiement « succeeded »

---

## Partie B — Resend (emails)

### 1. Compte

1. [resend.com](https://resend.com) → créer un compte
2. **API Keys** → Create → copiez `re_…`
3. Vercel → `RESEND_API_KEY` = `re_…`

### 2. Expéditeur

Sans domaine personnalisé, Resend permet souvent d’envoyer depuis `onboarding@resend.dev` en test.

**Pour la prod** :

1. Resend → **Domains** → Add Domain → `renovsur.fr`
2. Ajoutez les enregistrements DNS chez votre registrar (OVH, Gandi…)
3. Attendez « Verified »
4. Vercel → `EMAIL_FROM` = `RénovSûr <noreply@renovsur.fr>`

### 3. Test

1. Analyse avec votre **email** dans le formulaire
2. Paiement 19 €
3. Vérifiez la boîte mail : « Votre Rapport Essentiel est prêt »
4. Test connexion `/compte` : code OTP par email

---

## Partie C — Mentions légales (obligatoire)

Sur Vercel (Production) :

| Variable | Exemple |
|----------|---------|
| `LEGAL_COMPANY_NAME` | Votre raison sociale ou nom |
| `LEGAL_SIRET` | Votre SIRET |
| `LEGAL_ADDRESS` | Adresse complète |
| `LEGAL_DIRECTOR` | Nom du responsable |

Redeploy → ouvrez `/mentions-legales` : le bandeau orange doit disparaître.

---

## Checklist finale

- [ ] `/api/health` → `launchReady: true`
- [ ] Aperçu gratuit → résultats OK
- [ ] Paiement 19 € → rapport débloqué
- [ ] Email reçu après achat
- [ ] `/compte` avec le même email
- [ ] `/exemple-rapport` pour montrer le produit sans payer

---

## En cas de problème

| Symptôme | Cause probable |
|----------|----------------|
| Paiement OK mais rapport bloqué | Webhook mal configuré ou `STRIPE_WEBHOOK_SECRET` incorrect → redeploy |
| Pas d’email | `RESEND_API_KEY` manquant ou domaine non vérifié |
| Mentions légales orange | `LEGAL_*` non renseignées |
| 404 après analyse | `BLOB_READ_WRITE_TOKEN` manquant sur Vercel |

Support Stripe : [support.stripe.com](https://support.stripe.com)
