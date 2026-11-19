# SPRINT 24H — Fiche 1-Page (`[Nom du SaaS]`)

> **Objectif** : Cadrer en `<= 15` minutes à `09:05`, déployer une URL publique propre avant `H+2`, puis livrer `4–6` tickets verticaux maximum.

## 1. Positionnement Express (4 lignes)
- **Problème** : `[Douleur claire et immédiate]`
- **ICP** : `[Qui paye aujourd'hui pour ce résultat ?]`
- **Action IA (Moment Aha)** : `[Entrée -> Sortie structurée générée en < 15s]`
- **Offre & Prix (€)** : `[One-Shot >= 9 € ou Abonnement payant immédiat — 0 essai gratuit 0 €]`

## 2. Modèle de Données (`<= 3` Tables Métier Max)
1. `public.profiles` (déjà prêt : `credits`, `plan`, `is_active`, `stripe_*`)
2. `public.[table_1]` : `[colonnes clés + FK user_id + RLS (select auth.uid())]`
3. `public.[table_2]` (optionnelle) : `[colonnes clés + FK user_id]`

## 3. Découpage Vertical (`4–6` Tickets Max)
- [ ] **T1 (H+1)** : Config `site.ts`, Copy Landing `/`, déploiement Vercel public (`Allow: /`).
- [ ] **T2 (H+3)** : Migration SQL `002_*.sql` + schémas Zod + noyau IA (`generateStructured`).
- [ ] **T3 (H+6)** : Tunnel `/try` (Aha sans login préalable, draft local, mobile `100dvh`).
- [ ] **T4 (H+9)** : Checkout Stripe Live + webhook HMAC idempotent + email accès.
- [ ] **T5 (H+12)** : Dashboard résultats + historique + déduction atomique `decrement_user_credits`.
- [ ] **T6 (H+16)** : Audit `red-team-auditor`, crash-test mobile `375px`, `npm run check` = `0`.

## 4. Checklist Conformité Course (Art. 6, 7 & 8)
- [ ] Repo public créé après `09:00` avec bloc d'attribution `saas-juliennoel-fr-boilerplate` dans `README.md`.
- [ ] `/` public sans mur auth, sans CAPTCHA, `robots.ts` = `Allow: /`.
- [ ] Paiements réels via Stripe Hosted Checkout (zéro fausse transaction live ; tests via `VIP_*` uniquement).
- [ ] Clé Stripe Read-Only prête pour vérification traction.
