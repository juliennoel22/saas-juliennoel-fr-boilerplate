# 01 — Architecture Technique (`[Nom du SaaS]`)

## 1. Stack & Contraintes Structurales
- **Runtime** : Next.js 16 (App Router, Turbopack, `src/proxy.ts`), React 19, TypeScript strict (`0 any`, `noUncheckedIndexedAccess`).
- **UI** : Tailwind CSS v4 + `@coss` (`@base-ui/react`) Full White Minimalist.
- **Limites fichiers** : `< 300` lignes par fichier source (`< 150` lignes sous `src/components/ui/*`).
- **Patterns** : *Parse, Don't Validate* (Zod v4), *Railway-Oriented Programming* (`Result<T, E>`), *Functional Core / Imperative Shell*.

## 2. Arborescence Métier (Delta sur Boilerplate)
```text
src/
├── lib/domain/          # Noyau pur (calculs, règles métier, 0 I/O)
├── lib/schemas/         # Contrats Zod v4 (entrées API + sorties IA)
├── app/api/<feature>/   # Coquilles HTTP (auth getUser, Zod, rate limit, core)
└── components/<feature>/# Composants UI modulaires (< 300 L)
```

## 3. Contrats Zod & Couche IA Provider-Agnostique
- Tous les appels LLM passent par `src/lib/ai/generate.ts` (`generateStructured`).
- **Fournisseur principal** : `AI_PROVIDER` + `AI_MODEL` (ex. OpenRouter / Google / Mistral / OpenAI / Anthropic).
- **Résilience** : `AbortSignal.timeout(25_000)`, `maxRetries <= 2`, fallback automatique `AI_FALLBACK_PROVIDER`, re-parse Zod post-inférence.
- **Recherche web (optionnelle)** : `src/lib/ai/search-tavily.ts` (dégradation contrôlée si `TAVILY_API_KEY` absente).

## 4. Endpoints API & MCP
| Endpoint | Méthode | Auth | Garde-fous |
| :--- | :--- | :--- | :--- |
| `/api/health` | GET | Public | `Cache-Control: no-store`, 0 secret exposé |
| `/api/checkout` | POST | Public / User | Origin check, rate limit, Zod, Art. L221-28 |
| `/api/stripe/portal` | POST | `getUser()` | Origin check, ownership `stripe_customer_id` |
| `/api/uploads/sign` | POST | `getUser()` | Allow-list MIME, taille `<= 10 Mo`, UUID path |
| `/api/webhooks/stripe` | POST | HMAC Stripe | `constructEvent`, idempotence `webhook_events` |
| `/api/mcp` | GET/POST | `MCP_API_KEY` | Toggle `siteConfig.features.mcpEnabled`, Zod |
| `/api/[metier]` | POST | `[Public|User]` | `decrement_user_credits`, Zod, `Result<T,E>` |
