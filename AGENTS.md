# AGENTS.md — Harnais SDD (`saas-juliennoel-fr-boilerplate`)

> Point d'entrée unique pour tout agent IA opérant sur ce dépôt. Garder ce fichier `<= 110` lignes.

## 1. Modes de Travail (Dual-Mode SDD)
- **Sprint 24h (Hackathon / FounderRace)** :
  1. Lancer `npm run setup:race -- --name "..." --slug "..." --init-specs 24h`.
  2. Compléter `specs/SPRINT_24H.md` (1 page : Problème, ICP, Offre €, `<= 3` tables SQL, `4–6` tickets verticaux max).
  3. Implémenter ticket par ticket en gardant chaque session `< 20k` tokens.
- **Mode Standard (SaaS Factory)** :
  1. Lancer `npm run setup:race -- --name "..." --slug "..." --init-specs standard`.
  2. Remplir `specs/00_PRD.md` -> `04_TRACKING_LEGAL.md` + `ROADMAP_TICKETS.md` (`0` code prématuré).
  3. Exécuter chaque `specs/tickets/TICKET_XX_*.md` en TDD strict puis mettre à jour `specs/STATUT.md` et `specs/feature_list.json`.

## 2. Invariants Techniques Non-Négociables
- **Taille & Typage** : `< 300` lignes par fichier source (`< 150` lignes sous `src/components/ui/*`), `0 any`, `noUncheckedIndexedAccess: true`.
- **Next.js 16** : `await params` / `await searchParams` obligatoires ; session refresh dans `src/proxy.ts` (bypass `/api/*` et `/ingest`, copie des cookies sur redirect).
- **Parse, Don't Validate & Railway** : Zod v4 aux frontières + `Result<T, E>` (`src/types/result.ts`) sur toute logique métier.
- **Functional Core / Imperative Shell** : logique métier pure et testable sans I/O ; routes API et Server Actions en coquilles d'orchestration minces.
- **Supabase Sécurisé** : `supabase.auth.getUser()` serveur strict (jamais `getSession()`), RLS `(select auth.uid())`, `SECURITY DEFINER SET search_path = ''`, `REVOKE ALL FROM PUBLIC, anon`, `isValidUUID()` avant requête DB, zéro `.update()` client sur `credits`/`plan`/`is_active`/`stripe_*`.
- **Paiements Stripe** : Hosted Checkout uniquement (zéro Express Checkout, zéro essai `0 €`), plancher `Math.max(50, priceCents)`, idempotence `webhook_events` (`23505`), case `Art. L221-28 13°` non pré-cochée, `pageshow` BFCache reset.
- **IA Provider-Agnostique** : passer par `src/lib/ai/generate.ts` (`ai` Vercel AI SDK + Zod Structured Outputs + retry `<= 2` + fallback automatique). Jamais de lock-in fournisseur.
- **UI Full White & Anti-AI Slop** : primitives `@coss` (`npx shadcn@latest add @coss/<name>`), palette `#FFFFFF`/`#09090B`/`#E4E4E7`/`#10B981`, mobile `min-h-[100dvh]`, inputs `>= 16px`, cibles `>= 44px`, `0` emoji, `0` icône `Sparkles`, `0` faux timer/avis.
- **Tracking & Uploads** : pare-feu PostHog (`src/lib/posthog/firewall.ts`) actif sur trafic dev/test/VIP ; fichiers `> 1 Mo` via Signed Upload URL (`/api/uploads/sign`).

## 3. Protocole de Vérification, Recette & Gouvernance
- **Avant toute clôture de ticket** : exécuter `npm run check` (`typecheck` + `lint` + `test` + `build`) -> code de sortie `0`.
- **Recette Binaire, Preview & Tunnel Mobile** : distinguer *(1) vérifié par l'agent* (`npm run check`, webhook sim) et *(2) testé par Julien* (commande/URL 1-clic) ; sur tout ticket UI/paiement/mobile, proposer **Vercel Preview (`vercel` sans `--prod`)** pour Remote Control/iPhone ou `mobile-local-tunnel` (`npm run build && npm start` + `cloudflared`, jamais `next dev`), avec `https://*.vercel.app/**` et `https://*.trycloudflare.com/**` dans Supabase Auth Redirect URLs et Production publique.
- **Audit obligatoire sur auth/paiement/SQL** : lancer les subagents `red-team-auditor` & `mentor-solo-builder` (zéro secret commité, zéro fuite PII).
- **Intégrité Copy Diff** : pour toute modification de texte visible client, fournir le diff exact *Avant -> Après* sans fausse promesse.
- **Zéro action Git/Déploiement autonome** : `git commit`, `git push`, `merge` et `vercel --prod` uniquement sur ordre explicite de Julien.

## 4. Index Rapide & Outillage WSL
- Configuration produit unique : `src/config/site.ts`
- Schéma SQL durci : `supabase/migrations/001_initial_schema.sql`
- Mémoire projet : `.gemini/memory/{MEMORY,adrs,blockers,learnings}.md`
- Gabarits SDD : `specs/templates/*` et `specs/feature_list.json`
- Skills & Subagents WSL (`~/.agents/skills/` & `~/.claude/skills/`) : `saas-scoping-architect`, `sdd-ticket-executor`, `robust-engineering-standard`, `premium-craft-auditor`, `mobile-local-tunnel`, `coss`, `Google.securecoder`, `red-team-auditor`, `mentor-solo-builder`.
- Second Brain (référence lecture seule si besoin) : `/mnt/c/Users/julie/Dropbox/AUTRE/BRAIN_GAME_OS/BRAIN/`
