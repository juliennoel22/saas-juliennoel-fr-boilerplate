# 02 — Base de Données & RLS (`[Nom du SaaS]`)

## 1. Tables Socle (Déjà livrées dans `001_initial_schema.sql`)
- `public.profiles` : profil utilisateur, solde `credits >= 0`, `plan`, `is_active`, `stripe_*`, `utm_*`.
- `public.webhook_events` : journal d'idempotence Stripe (`service_role` exclusif, `0` policy publique).
- `public.credit_ledger` : journal append-only des mouvements de crédits.

## 2. Tables Métier à Ajouter (`002_<feature>.sql`)
> Objectif Sprint 24h : `<= 3` tables métier maximum.

```sql
CREATE TABLE IF NOT EXISTS public.<table_metier> (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_<table_metier>_user_id
  ON public.<table_metier> (user_id);

ALTER TABLE public.<table_metier> ENABLE ROW LEVEL SECURITY;

CREATE POLICY "<table_metier>_select_own"
  ON public.<table_metier>
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);
```

## 3. Checklist Sécurité Supabase (`0` Alerte Advisor)
- [ ] Toutes les policies RLS utilisent `(select auth.uid())` (jamais `auth.uid()` nu).
- [ ] Aucune policy permissive chevauchante sur la même table et la même action.
- [ ] Toutes les fonctions `SECURITY DEFINER` portent `SET search_path = ''` + `REVOKE ALL FROM PUBLIC, anon`.
- [ ] Toutes les clés étrangères disposent d'un index explicite.
- [ ] Toute table de webhooks ou secrets serveur a RLS activé et `0` policy publique.
- [ ] Tous les UUID entrants sont validés via `isValidUUID()` avant requête SQL.
- [ ] Après migration : exécuter `npm run db:types` et auditer les Advisors Supabase.
