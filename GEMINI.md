# GEMINI.md — Contexte Antigravity WSL

Lire `@AGENTS.md` avant toute modification.

## Index des Spécifications & Mémoire
- Contrat de vérification : `specs/feature_list.json`
- Tickets atomiques : `specs/tickets/`
- Gabarits SDD (Standard & Sprint 24h) : `specs/templates/`
- Décisions & Retours terrain : `.gemini/memory/adrs.md`, `.gemini/memory/learnings.md`, `.gemini/memory/blockers.md`, `.gemini/memory/MEMORY.md`

## Invariants Critiques
1. `< 300` lignes/fichier (`< 150` lignes sous `src/components/ui/*`), `0 any`.
2. Next.js 16 : `src/proxy.ts` + `await params` / `await searchParams`.
3. Supabase : `getUser()` serveur strict, RLS `(select auth.uid())`, `SECURITY DEFINER SET search_path = ''`, `isValidUUID()`.
4. Stripe : Hosted Checkout uniquement, idempotence `webhook_events`, `pageshow` BFCache.
5. IA : `src/lib/ai/generate.ts` (Vercel AI SDK + Zod + fallback).
6. Vérification obligatoire après dernière édition : `npm run check` (exit `0`).
7. Zéro `git commit`, `git push` ou `vercel --prod` sans ordre explicite.
