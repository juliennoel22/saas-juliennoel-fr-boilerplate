# saas-juliennoel-fr-boilerplate

Generic, modular Next.js 16 + Supabase + Stripe Hosted Checkout + provider-agnostic AI SDK boilerplate built for rapid solo SaaS launches (24h sprint & standard SDD workflows).

> **Zero product-specific logic**: all copy, plans, and flows ship as neutral placeholders (`src/config/site.ts`), compliant with FounderRace Article 6 & Article 7.

## Boilerplate Attribution (FounderRace Art. 7)

Keep and adapt this block in any repository bootstrapped from this template:

```markdown
## Boilerplate Attribution (FounderRace Art. 7)

This project was bootstrapped from the public generic boilerplate:
- **Repository**: https://github.com/juliennoel22/saas-juliennoel-fr-boilerplate
- **Scope**: Generic Next.js 16 + Supabase + Stripe Hosted Checkout + AI SDK infrastructure (zero product-specific business logic prior to launch).
```

## Architecture Highlights

- **Framework**: Next.js 16 (App Router, Turbopack, `src/proxy.ts`), React 19, TypeScript strict (`0 any`, `noUncheckedIndexedAccess`).
- **UI**: Tailwind CSS v4 + `@coss` primitives (`@base-ui/react`) in Full White Minimalist (`#FFFFFF` / `#09090B` / `#E4E4E7` / `#10B981`, `Geist` & `Geist Mono`), mobile `100dvh`, `>= 16px` inputs, `>= 44px` touch targets.
- **Database & Auth**: `@supabase/ssr` with hardened SQL (`001_initial_schema.sql`), `(select auth.uid())` RLS, `SECURITY DEFINER SET search_path = ''`, protected profile column guard trigger, atomic `FOR UPDATE` credit RPCs, and Signed Upload URLs (`/api/uploads/sign`).
- **Billing**: Stripe Hosted Checkout (`payment` & `subscription`, `Math.max(50, priceCents)` floor, `Art. L221-28 13°` waiver), Customer Portal, HMAC-verified idempotent webhooks (`webhook_events`), and `VIP_*` test bypass without live Stripe transactions.
- **AI Layer**: 100% provider-agnostic via Vercel AI SDK (`openrouter`, `google`, `openai`, `mistral`, `anthropic`) with Zod Structured Outputs, post-inference validation, bounded retries (`<= 2`), automatic fallback provider, and optional Tavily Search client.
- **Observability & Email**: PostHog `/ingest` reverse proxy + SSR zero-flicker bootstrap + test traffic firewall + Resend wrapper with safe console no-op fallback.
- **MCP Endpoint (`/api/mcp`)**: Toggleable Streamable HTTP / JSON-RPC 2.0 server (`initialize`, `tools/list`, `tools/call`) with optional `MCP_API_KEY` bearer authentication.

## Quickstart

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Bootstrap a New SaaS (24h Sprint or Standard SDD)

To start a fresh repository on race day without inheriting the boilerplate Git history (FounderRace Art. 7):

```bash
npx degit juliennoel22/saas-juliennoel-fr-boilerplate my-saas
cd my-saas
git init
npm install
npm run doctor
npm run setup:race -- \
  --name "Product Name" \
  --slug "product-slug" \
  --tagline "Concrete user outcome in one line." \
  --billing one_shot \
  --price-cents 1900 \
  --auth post_aha \
  --mcp true \
  --lang fr \
  --init-specs 24h
```

Notes:
- `--price-cents` updates `plans.starter.priceCents` in `src/config/site.ts`; adjust `plans.pro` directly in `src/config/site.ts` if needed.
- Ensure `supabase login` is completed (`npm run doctor`) before provisioning cloud migrations.
- In `.mcp.json`, configure Stripe using a **Restricted API Key (RAK)** or OAuth rather than a full `sk_live_` secret.

### Operational Scripts

```bash
npm run check                                       # typecheck + lint + vitest + next build
npm run admin -- grant user@domain.com 50           # provision user + credits via service_role
npm run admin -- link user@domain.com /dashboard    # generate Supabase magic link
npm run admin -- info user@domain.com               # inspect profile state
npm run test:webhook                                # send signed Stripe webhook x2 (verifies dedup)
```

### Connecting to `/api/mcp`

When `siteConfig.features.mcpEnabled` is `true`, connect any MCP client (Claude Code, Cursor, ChatGPT) via Streamable HTTP:

```json
{
  "mcpServers": {
    "my-saas": {
      "type": "http",
      "url": "https://your-domain.com/api/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_API_KEY>"
      }
    }
  }
}
```
