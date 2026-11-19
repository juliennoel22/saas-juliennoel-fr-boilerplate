# ADRs — Décisions Architecturales Fondatrices

## ADR-001 — Next.js 16 `src/proxy.ts` au lieu de `middleware.ts`
- **Contexte** : Next.js 16 déprécie `middleware.ts` au profit de `proxy.ts`.
- **Décision** : Rafraîchissement session Supabase dans `src/proxy.ts` avec bypass strict `/api/*` et `/ingest`, copie des cookies sur redirect, et protection exclusive de `/dashboard` pour garder `/` 100 % public et capturable par crawler.

## ADR-002 — Stripe Hosted Checkout uniquement (Zéro Express Checkout, Zéro Essai 0 €)
- **Contexte** : Retours prod multi-projets montrant un taux d'échec élevé sur les essais à 0 € (cartes prépayées vides) et une surcharge de configuration domaine Apple Pay en sprint 24h.
- **Décision** : Redirection Stripe Hosted Checkout (`payment` avec `customer_creation: "always"` ou `subscription`), plancher `Math.max(50, priceCents)`, case `Art. L221-28 13°`, idempotence `webhook_events`, reset BFCache `pageshow`.

## ADR-003 — Couche IA 100 % Provider-Agnostique (Vercel AI SDK + Zod)
- **Contexte** : Éviter le verrouillage sur un seul fournisseur IA et basculer librement entre OpenRouter, Google, OpenAI, Mistral et Anthropic.
- **Décision** : Abstraction unique `src/lib/ai/provider.ts` + `src/lib/ai/generate.ts` avec `Output.object({ schema })`, `supportsStructuredOutputs: true`, re-parse Zod post-inférence, retry `<= 2`, timeout `25s` et bascule automatique sur `AI_FALLBACK_PROVIDER`.

## ADR-004 — SQL Supabase Durci (`0` Alerte Advisor)
- **Contexte** : Risques de contournement RLS, fuite `search_path`, escalade de privilèges sur `profiles.credits` et doubles débits concurrents.
- **Décision** : Policies `(select auth.uid())`, trigger `SECURITY INVOKER` `guard_profile_sensitive_columns()`, `SECURITY DEFINER SET search_path = ''`, `REVOKE ALL FROM PUBLIC, anon`, `decrement_user_credits` verrouillé `FOR UPDATE` avec vérification stricte du rôle JWT, `webhook_events` sans policy publique, bucket privé `user-uploads` borné à 10 Mo + allowlist MIME.

## ADR-005 — Modularité Stricte (`< 300 L`, `< 150 L` UI) & Design Full White Minimalist
- **Contexte** : Maintenir un contexte IA `< 20k` tokens par ticket et garantir un niveau de craft `>= 90/100`.
- **Décision** : Primitives `@coss` découpées sous 150 lignes, palette Full White (`#FFFFFF`/`#09090B`/`#E4E4E7`/`#10B981`), `Geist` + `Geist Mono`, zéro AI slop.
