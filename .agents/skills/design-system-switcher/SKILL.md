---
name: design-system-switcher
description: Permet de basculer facilement l'interface d'un projet Next.js + Tailwind v4 entre 4 Design Systems complets et documentés (flat-base, apple-design, onesale, custom-hybrid) sur simple demande ("passe en design system X").
---

# Design System Switcher (`4` Presets Officiels)

Ce skill permet d'appliquer ou de basculer d'un design system à un autre sur n'importe quel projet Next.js 16 + Tailwind v4 (`@coss` / `shadcn/ui`) sur simple instruction orale (*"passe en design system OneSale"*, *"passe en Apple Design"*, *"remets en Base Plat"*, *"passe en Custom Fusionné"*).

## Règles Communes Non-Négociables (Tous Presets)
- **Mobile iOS Safari** : `min-h-[100dvh]`, inputs `>= 16px` sur `< 768px`, cibles tactiles `>= 44px` (`min-h-11`).
- **Modularité** : `< 300` lignes/fichier (`< 150` lignes sous `src/components/ui/*`), `0` emoji, `0 Sparkles`, `0` faux timer/avis.
- **Vérification** : toujours exécuter `npm run check` après application d'un preset.

---

## Preset 1 — `flat-base` (Base Plat — Défaut Boilerplate)
- **Usage** : vitrine neutre ultra-rapide, lisibilité maximale, zéro distraction.
- **Tokens** : `--background: #FFFFFF`, `--foreground: #09090B`, `--muted: #F4F4F5`, `--border: #E4E4E7`, `--primary: #09090B`, `--success: #10B981`.
- **Typographie** : `Geist` (`--font-sans`) + `Geist Mono` (`--font-mono`).
- **Boutons & Cartes** : primitives `@coss` (`rounded-lg` / `rounded-2xl`), bordures `1px` nettes, ombres minimales (`shadow-xs`).

---

## Preset 2 — `apple-design` (Apple Fluid Minimalist)
- **Usage** : SaaS grand public / B2C / mobile-first exigeant une sensation native fluide.
- **Référence** : `.agents/skills/apple-design/SKILL.md`.
- **Tokens** : Full White `#FFFFFF` / `#09090B`, chrome translucide (`rgba(255,255,255,0.78)` + `backdrop-filter: blur(20px) saturate(180%)`).
- **Typographie** : titres display `letter-spacing: -0.03em; line-height: 1.06; font-optical-sizing: auto;`, corps `letter-spacing: 0`.
- **Physique & Mouvement** : retour instantané au `pointer-down` (`active:scale-[0.975]`, `110ms`), tiroirs/modales interruptibles à ressort (`damping 1.0`, `response 0.3–0.4s`), support strict `prefers-reduced-motion` et `prefers-reduced-transparency`.
- **Surfaces** : ombres multi-couches douces (`0 1px 2px rgba(9,9,11,0.04), 0 20px 48px -16px rgba(9,9,11,0.08)`), `rounded-3xl` sur conteneurs majeurs.

---

## Preset 3 — `onesale` (OneSale 3D Acrylic Tactile)
- **Usage** : SaaS créateurs, outils IA conversion forte, interfaces sombres à fort relief tactile.
- **Tokens** :
  - Canvas `#05050A`, Surface `#0E0F17`, Muted `#161824`, Foreground `#FFFFFF`, Muted Foreground `#8E92A4`, Border `rgba(255, 255, 255, 0.1)`.
  - Grille de fond spatiale : `radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)` (`24px 24px`).
  - Accents : `#7938EB` -> `#5B21B6` -> `#3B0764` (bordure basse `#1D033A`), conversion `#10B981` / `#00FFA3`.
- **Typographie** : `Bricolage Grotesque` (titres) + `Geist` (corps) + `Geist Mono` (métriques).
- **Bouton Primaire Tactile 3D (`.btn-blurple-tactile`)** :
  - `background: linear-gradient(135deg, #7938EB 0%, #5B21B6 50%, #3B0764 100%)`
  - `border: 1px solid rgba(255, 255, 255, 0.25); border-bottom: 3px solid #1D033A;`
  - `box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.35);`
  - Hover : `filter: brightness(1.1); transform: translateY(-1px);`
  - Active : `transform: translateY(2px); border-bottom-width: 1px;`
- **Boutons Secondaires / Outline** : `border-b-[3px] border-b-black/60`, `hover:-translate-y-px active:translate-y-px`.
- **Variante `onesale-light` (Thème Blanc OneSale)** : même grille de points (`rgba(9,9,11,0.08)`), même relief 3D tactile `border-bottom: 3px` sur les boutons et cartes, mais sur fond `--background: #FFFFFF`, `--card: #FFFFFF`, `--border: #E4E4E7`, `--foreground: #09090B` avec couleur primaire personnalisable (`#6D28D9` violet, `#18181B` encre, `#059669` émeraude ou `#2563EB` bleu).

---

## Preset 4 — `custom-hybrid` (Fusionné : Full White + Apple Motion + Tactile 3D + CardFrame)
- **Usage** : le meilleur des 3 mondes — clarté Full White (`#FFFFFF` / `#09090B`) + structure `@coss` / `CardFrame` + chrome translucide & typographie optique `apple-design` + boutons relief 3D tactiles inspirés d'OneSale (version encre `#09090B` avec bordure basse `3px` et enfoncement `translateY(2px)` au clic).
- **Tokens** : `#FFFFFF`, `#09090B`, `#F4F4F5`, `#E4E4E7`, `#10B981`.
- **Bouton Primaire Tactile Light** :
  - `background: linear-gradient(180deg, #27272A 0%, #09090B 100%)`
  - `border: 1px solid #09090B; border-bottom: 3px solid #000000;`
  - `box-shadow: 0 4px 14px rgba(9, 9, 11, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.18);`
  - Active : `transform: translateY(2px); border-bottom-width: 1px;`
- **Bouton Outline Tactile Light** : `bg-white border border-zinc-200 border-b-[3px] border-b-zinc-300 active:translate-y-[2px] active:border-b`.
- **Cartes** : `CardFrame` à en-tête `bg-muted/60` + `rounded-2xl` + ombre multi-couches douce.

---

## Procédure d'Application par l'Agent
1. Mettre à jour `src/app/globals.css` (variables `:root` + classes utilitaires du preset choisi).
2. Mettre à jour `src/components/ui/button.tsx` (et `Navbar.tsx` / `HeroPlaceholder.tsx` / `PricingSection.tsx` si le preset change la hiérarchie ou le fond).
3. Vérifier `< 300` lignes/fichier (`< 150` lignes sous `src/components/ui/*`).
4. Exécuter `npm run check` -> exit `0`.
