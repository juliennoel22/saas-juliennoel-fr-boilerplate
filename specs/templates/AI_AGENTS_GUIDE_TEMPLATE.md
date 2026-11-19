# Guide d'Orchestration des Agents IA (`[Nom du SaaS]`)

## 1. Routage des Modèles par Type de Tâche
| Phase | Modèle Recommandé | Budget Contexte |
| :--- | :--- | :--- |
| Cadrage SDD, PRD, SQL/RLS, Architecture | `Orchestrator (Neon)` / `Opus` / `Gemini 4 Hydrogen Extra` | `< 30k` tokens |
| Implémentation Ticket Atomique (`1` ticket = `1` session) | `Orchestrator` / `Sonnet` | `< 20k` tokens |
| Audit Sécurité / Red-Team / Revue Architecture | Subagent `red-team-auditor` + `mentor-solo-builder` | Isolé |
| Chiffres traction / Unit Economics | Subagent `business-data-advisor` | MCP Grounded |
| Corrections mineures / scripts / formatage | `Flash` / `Haiku` | `< 10k` tokens |

## 2. Protocole d'Exécution d'un Ticket (`sdd-ticket-executor`)
1. Lire **uniquement** `@AGENTS.md`, le ticket `specs/tickets/TICKET_XX_*.md` et les fichiers listés dans sa portée.
2. Écrire le test unitaire/intégration en premier (TDD — échec rouge vérifié).
3. Implémenter en respectant `< 300` lignes/fichier (`< 150` lignes UI), Zod v4, `Result<T, E>`, `0 any`.
4. Exécuter `npm run check` (`typecheck` + `lint` + `test` + `build`) -> sortie `0`.
5. Vérifier le Diff Copy (*Avant -> Après*) pour tout texte visible client.
6. Mettre à jour `specs/STATUT.md`, `specs/feature_list.json` et `.gemini/memory/MEMORY.md`.

## 3. Grounding MCP Obligatoire
- **Supabase** : vérifier tables, migrations et `get_advisors` avant de clore un ticket DB.
- **Stripe** : vérifier webhooks et mode test/live sans jamais créer de paiement factice en Live.
- **PostHog / Vercel** : vérifier build, variables d'environnement et absence d'erreurs runtime.

## 4. Règles de Sécurité & Git
- Zéro secret hardcodé dans le dépôt (`.env.local` uniquement).
- Aucun `git commit`, `git push`, `merge` ou `vercel --prod` autonome sans ordre explicite.
