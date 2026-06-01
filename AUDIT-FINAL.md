# Audit final pré-lancement — RénovSûr

Date : audit complet sécurité, paiement, monétisation.

---

## Verdict global

| Domaine | Statut | Note |
|---------|--------|------|
| Paiement Stripe | ✅ Solide | Vérification session + webhook idempotent |
| Contournement gratuit | ✅ Corrigé | Plus de `?unlocked=` / `?success=` |
| Aperçu gratuit | ✅ Strict | 1× à vie, contenu masqué |
| Modèle économique | ✅ Cohérent | Pay-per-report + pack 3 devis |
| Headers sécurité | ✅ OK | Middleware |
| Rate limiting | ✅ OK | Analyze + checkout + contact |
| Production | ⚠️ Config | `DEMO_MODE=false` + Stripe obligatoire |

**Prêt pour lancement** après configuration Stripe + mentions légales.

---

## Paiement — ce qui est en place

1. **Stripe Checkout** — paiement unique, pas d'abonnement
2. **Déblocage uniquement si** `payment_status === "paid"` vérifié côté serveur
3. **Webhook signé** (`STRIPE_WEBHOOK_SECRET`) — source de vérité
4. **Redirect success** — backup si webhook lent, **même fonction** `fulfillCheckoutSession`
5. **Idempotence** — une session Stripe = un seul déblocage / un seul lot de crédits (corrigé)
6. **DEMO_MODE** — déblocage sans Stripe **uniquement** si `DEMO_MODE=true` (local)
7. **Rate limit checkout** — anti-spam création sessions

### Tarifs actifs

| Plan | Prix | Contenu |
|------|------|---------|
| Aperçu | 0 € | 1× à vie — score + compteurs, **sans détail** |
| Essentiel | 19 € | Alertes, prix marché, légal, économies |
| Négociation | 39 € | Essentiel + lettre |
| Pack 3 devis | 49 € | 3 crédits Essentiel |

---

## Failles corrigées lors de cet audit

| Faille | Gravité | Correction |
|--------|---------|------------|
| Double crédits pack (webhook + redirect) | 🔴 Critique | Idempotence `processed-sessions.json` |
| Double déblocage rapport | 🟠 Moyen | Idem |
| Crédit consommé puis analyse échoue | 🟠 Moyen | Consommer crédit **avant** analyse |
| `?unlocked=` / `?success=1` | 🔴 Critique | Supprimé (sessions précédentes) |
| Checkout sans Stripe en prod | 🔴 Critique | Erreur 503 sauf DEMO_MODE |
| IDs rapport invalides | 🟡 Faible | Validation UUID |

---

## Ce qui reste acceptable (limites connues)

| Limite | Impact | Mitigation future |
|--------|--------|-------------------|
| Cookie effacé = nouvel aperçu gratuit | Faible fraude | Compte email / CAPTCHA |
| Données en fichiers JSON | Pas multi-serveur | PostgreSQL / Vercel KV |
| Rate limit en mémoire | Reset au redeploy | Redis |
| Exemple démo illimité | Spam DB only | Rate limit sample |
| CORS `*` hors origines listées | Faible | Restreindre en prod |

---

## Checklist production (obligatoire)

```env
DEMO_MODE=false
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=https://votre-domaine.fr
```

- [ ] Webhook Stripe → `POST /api/webhook/stripe`
- [ ] Tester : aperçu → paiement 19€ → rapport débloqué
- [ ] Tester : pack 49€ → 3 analyses payées
- [ ] Compléter mentions légales (SIRET, adresse)
- [ ] `data/` exclu du git (rapports clients)

---

## Lancer en local (ports 3000/3002 occupés)

```bash
cd web && npm run dev
# → http://localhost:3003
```

---

## Conclusion

Le produit est **aligné business + sécurité** pour un lancement MVP :
- Pas d'abonnement inutile
- Pas de rapport complet gratuit répété
- Paiement vérifiable et non contournable
- Pack 3 devis pour le cas réel (comparer artisans)

Prochaine étape : **domaine + Stripe live + déploiement Vercel**.
