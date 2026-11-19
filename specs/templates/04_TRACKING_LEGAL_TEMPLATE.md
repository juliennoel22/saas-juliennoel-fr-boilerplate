# 04 — Tracking Analytics & Conformité Légale (`[Nom du SaaS]`)

## 1. Plan de Marquage PostHog (`/ingest` + SSR Bootstrap)
| Événement | Source | Propriétés clés | Condition d'envoi |
| :--- | :--- | :--- | :--- |
| `$pageview` | Client (`PHProvider`) | `pathname`, `utm_*` | Hors trafic test (`isTestTraffic === false`) |
| `aha_started` | Client (`/try`) | `step` | Hors trafic test |
| `aha_completed` | Serveur / Client | `latencyMs`, `provider` | Hors trafic test |
| `checkout_initiated` | Client (`CheckoutButton`) | `planKey`, `priceCents` | Hors trafic test |
| `purchase_completed` | Serveur (Webhook Stripe) | `planKey`, `amountCents`, `currency` | `event.livemode === true` ET `!isTestTraffic` |

## 2. Pare-Feu Trafic Test (Obligatoire)
- Toute requête provenant de `localhost`, `127.0.0.1`, `.trycloudflare.com`, `.ngrok`, comptes test, codes `VIP_*` ou Stripe `livemode === false` est filtrée par `src/lib/posthog/firewall.ts`.
- Ne jamais créer de transaction factice sur Stripe Live pour tester.

## 3. Conformité Légale & Consommation (`src/app/legal/page.tsx`)
- **Mentions légales** : renseigner `siteConfig.legal` (`companyName`, `supportEmail`, `websiteUrl`, `jurisdiction`) avant ouverture commerciale.
- **Droit de rétractation numérique (Art. L221-28 13°)** : case à cocher **non pré-cochée** sur `PricingSection` et `TunnelShell` validée côté serveur par `POST /api/checkout`.
- **RGPD & Sous-traitants** : lister Supabase, Stripe, Vercel, Resend, PostHog et le fournisseur IA choisi.
- **Crawlers / FounderRace Art. 6** : garder `src/app/robots.ts` en `Allow: /` sans CAPTCHA ni mur auth sur `/`.
