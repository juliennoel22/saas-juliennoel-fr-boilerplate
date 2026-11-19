# 00 — PRD (`[Nom du SaaS]`)

> **Mode** : Standard SDD | Variante Express 24h (remplir uniquement les sections marquées `[24H]`)

## 1. Positionnement & Problème `[24H]`
- **Douleur mesurable** : `[Quelle tâche coûteuse/lente résout-on ?]`
- **ICP (Client Idéal)** : `[Rôle, contexte, budget, canal d'acquisition]`
- **Promesse en 1 phrase** : `[Résultat concret obtenu en < X minutes]`
- **Preuve / Moment Aha** : `[Ce que l'utilisateur voit avant de payer ou dans les 60 premières secondes]`

## 2. Offre & Tarification `[24H]`
- **Modèle** : `one_shot` (Pack Fondateur / Crédits) ou `subscription` (paiement immédiat).
- **Règle stricte** : zéro essai gratuit à `0,00 €` (plancher Stripe `>= 1,00 €`).
- **Offre Starter** : `[Nom]` — `[Prix €]` — `[Crédits / Quotas]`
- **Offre Pro** : `[Nom]` — `[Prix €]` — `[Crédits / Quotas]`

## 3. Flux Utilisateur E2E `[24H]`
1. **Landing `/`** : proposition de valeur claire, CTA direct vers `/try` ou `#pricing`.
2. **Parcours Aha `/try`** : saisie minimale -> aperçu concret -> déblocage Stripe Hosted Checkout.
3. **Paiement & Provisionnement** : webhook HMAC idempotent -> crédits attribués -> accès `/dashboard`.
4. **Rétention `/dashboard`** : solde crédits, historique, nouvelle action, portail facturation Stripe.

## 4. Métriques Cibles (Vérifiables)
- **Activation (Aha)** : `[% visiteurs démarrant /try -> résultat généré]`
- **Conversion Checkout** : `[% Aha -> paiement Stripe Live]`
- **Coût IA unitaire** : `[Coût tokens moyen / exécution vs marge brute >= 80 %]`

## 5. Hors-Scope Explicite (Anti-Bloat) `[24H]`
- `[Fonctionnalité exclue de la V1]`
- Multi-tenant B2B, RBAC complexe, i18n complet avant validation traction.
