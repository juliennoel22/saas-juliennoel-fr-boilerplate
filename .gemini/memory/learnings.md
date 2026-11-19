# Learnings — Invariants Capitalisés Multi-Projets

> Leçons vérifiées en production sur des SaaS précédents à respecter sur chaque nouveau projet.

1. **Auth & Supabase** :
   - Toujours utiliser `supabase.auth.getUser()` côté serveur (jamais `getSession()`).
   - Toujours valider tout UUID entrant via `isValidUUID()` avant requête PostgreSQL (prévient erreur `22P02`).
   - Toujours envelopper `auth.uid()` dans `(select auth.uid())` en RLS pour éviter `auth_rls_initplan`.
   - Bloquer toute mise à jour client directe de `credits`, `plan`, `is_active`, `stripe_*` via trigger `SECURITY INVOKER` (`current_user` reflète le rôle réel de l'appelant).
   - Gérer le réveil PWA iOS Safari (`visibilitychange` + `online`) pour éviter les sessions figées.
2. **Stripe & Conversion** :
   - Ne jamais proposer d'essai gratuit à `0,00 €` (taux d'échec élevé sur cartes prépayées vides).
   - Vérifier `session.payment_status` (`paid` / `no_payment_required`) et lever une erreur sur tout échec Supabase afin de déclencher le rollback `webhook_events` et le retry Stripe.
   - Extraire l'email client dans l'ordre : `customer_details.email` -> `payment_intent` (`latest_charge` / `charges.data[0].billing_details.email`) -> `stripe.customers.retrieve`.
   - Écouter `window.addEventListener("pageshow", ...)` sur tout bouton redirigeant vers Stripe Checkout ou Billing Portal pour réinitialiser l'état loading après retour navigateur (BFCache).
   - Garder `NODE_OPTIONS='--max-http-header-size=65536'` en dev pour éviter les erreurs HTTP 431 dues aux cookies combinés Supabase + PostHog.
3. **Uploads & Next.js** :
   - Ne jamais passer un fichier `> 1 Mo` dans une Server Action : compresser les images côté client (`1600px`, `q=0.8`) et téléverser directement via Signed Upload URL (`/api/uploads/sign`) dans un bucket privé borné en taille et MIME au niveau Storage.
4. **Analytics & Intégrité** :
   - Isoler `localhost`, `127.0.0.1`, `.trycloudflare.com`, emails internes (`POSTHOG_EXCLUDED_EMAILS`), VIP et `livemode === false` via `src/lib/posthog/firewall.ts`.
   - En SSR, borner `getPostHogBootstrap` (`<= 800ms`) et appeler `await client.shutdown()` systématiquement.
5. **MCP Stripe** :
   - Utiliser des clés restreintes (RAK) ou OAuth pour le serveur MCP Stripe.
