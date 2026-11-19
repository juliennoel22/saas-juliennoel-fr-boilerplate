# TICKET_XX — `[Titre Court Orienté Résultat]`

- **Statut** : `TODO` | `IN_PROGRESS` | `DONE`
- **Dépendances** : `[Aucune | TICKET_XX]`
- **Budget contexte** : `1` session isolée `< 20k` tokens

## 1. Objectif Produit & Portée Exacte
- **Problème résolu** : `[1-2 phrases factuelles]`
- **Hors-scope** : `[Ce que ce ticket ne modifie pas]`

## 2. Fichiers Autorisés (Modification / Création)
- `[src/...]` (`< 300` lignes, `< 150` lignes si `src/components/ui/*`)
- `[tests/...]`

## 3. Contrats & Invariants Techniques
- **Entrée / Sortie Zod** : `[Décrire le schéma exact]`
- **Sécurité** : `getUser()` serveur, `isValidUUID()`, RLS `(select auth.uid())`, zéro secret.
- **UI/UX (si applicable)** : Full White `@coss`, mobile `100dvh`, inputs `>= 16px`, cibles `>= 44px`, `0` emoji / `0 Sparkles`.

## 4. Plan TDD (Test-First Obligatoire)
1. Écrire le test échouant dans `tests/<nom>.test.ts` couvrant cas nominal + cas limites / erreurs.
2. Implémenter le noyau pur puis la coquille impérative (`Result<T, E>`).
3. Vérifier `npm run check` (`tsc --noEmit` + `eslint` + `vitest run` + `next build`) -> exit `0`.

## 5. Critères d'Acceptation & Rollback
- [ ] Tous les tests Vitest passent (`npm run test`).
- [ ] Tous les fichiers touchés respectent `< 300` lignes et `0 any`.
- [ ] Copy Diff *Avant -> Après* vérifié si texte client modifié.
- **Plan de rollback** : `[Comment annuler proprement migration/route/feature flag]`
