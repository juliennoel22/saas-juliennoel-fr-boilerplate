@AGENTS.md

## Routage Modèles (Session Isolée `< 20k` Tokens)
- **Architecture / Specs / Arbitrages / Audit Red-Team** : `Orchestrator (Neon)` / `Gemini 4 Neon (High/xhigh)` / `Gemini 4 Hydrogen (Extra)` / `Claude Opus 5.5`.
- **Exécution Ticket SDD (`1` ticket = `1` session)** : `Gemini 4 Hydrogen (Medium)` (ou `Orchestrator (Neon)` en multi-fichiers / `Claude Sonnet 5.5`).
- **Debug récalcitrant / Sécurité** : `Gemini 4 Hydrogen (High)` / `Claude Opus 5.5`.
- **Tâches répétitives / lint / scripts simples** : `Gemini 4 Hydrogen (Low)` / `Gemini 3.8 Flash`.

Respecter strictement les invariants définis dans `@AGENTS.md`, `specs/feature_list.json` et `.gemini/memory/learnings.md`.
