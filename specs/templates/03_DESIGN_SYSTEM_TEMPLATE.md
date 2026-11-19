# 03 — Design System & Craft UX (`[Nom du SaaS]`)

## 1. Palette Full White Minimalist (Verrouillée)
| Token | Valeur | Usage |
| :--- | :--- | :--- |
| `--background` | `#FFFFFF` | Surface principale |
| `--foreground` | `#09090B` | Texte principal et titres |
| `--muted` / `--muted-foreground` | `#F4F4F5` / `#71717A` | Fonds secondaires et métadonnées |
| `--border` / `--input` | `#E4E4E7` | Séparateurs et bordures 1px |
| `--primary` | `#09090B` | CTA principaux |
| `--success` | `#10B981` | Validation, indicateurs positifs / monétaires |
| `--destructive` | `#EF4444` | Erreurs et actions irréversibles |

- **Typographie** : `Geist` (`--font-sans`) + `Geist Mono` (`--font-mono` pour montants, crédits, IDs).

## 2. Primitives `@coss` (`@base-ui/react`)
- Ajouter uniquement depuis le registre officiel : `npx shadcn@latest add @coss/<composant>`.
- Vérifier que chaque fichier sous `src/components/ui/` reste `< 150` lignes.
- Utiliser `Drawer` (jamais `Sheet`) et `toastManager` (jamais Sonner).

## 3. Invariants Mobile iOS Safari & Surfaces Hybrides
- Landing & Dashboard : `max-w-5xl mx-auto`.
- Tunnel d'essai (`/try`), Auth (`/login`), Checkout : `max-w-md mx-auto min-h-[100dvh]`.
- Zéro `100vh` (toujours `100dvh`), `viewport-fit=cover`, `overscroll-behavior-y: none`.
- Inputs `>= 16px` sur mobile (anti-zoom iOS Safari).
- Cibles tactiles `>= 44×44px` (`min-h-11`).

## 4. Charte Anti-AI Slop & Crash-Test (`>= 90/100`)
- `0` emoji dans le code ou l'interface.
- `0` icône `Sparkles`, `0` dégradé néon générique, `0` faux compteur d'urgence, `0` faux témoignage.
- `0` spinner bloquant un CTA (`0 ms` de rendu interactif, skeletons calibrés `CLS = 0`).
- Empty states guidants avec `1` CTA primaire évident.
- Drafts locaux préservés (`localStorage`) + messages d'erreur factuels sans code brut SQL/HTTP.
