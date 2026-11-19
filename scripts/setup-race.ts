import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";

const cliSchema = z.object({
  name: z.string().trim().min(2).max(80).default("Mon SaaS"),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must match ^[a-z0-9-]+$")
    .default("mon-saas"),
  tagline: z.string().trim().min(4).max(160).default("Résultat immédiat en une action."),
  billing: z.enum(["one_shot", "subscription"]).default("one_shot"),
  priceCents: z.coerce.number().int().min(100).max(500_000).default(1900),
  auth: z.enum(["post_aha", "gated_dashboard"]).default("post_aha"),
  tunnel: z.enum(["input", "quiz", "upload", "audit"]).default("input"),
  mcp: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  lang: z.enum(["fr", "en"]).default("fr"),
  initSpecs: z.enum(["24h", "standard"]).default("24h"),
});

const ALLOWED_CLIS = ["node", "git", "gh", "supabase", "vercel", "stripe"] as const;

function checkCliAvailability(): Record<(typeof ALLOWED_CLIS)[number], boolean> {
  const status = {} as Record<(typeof ALLOWED_CLIS)[number], boolean>;
  for (const binary of ALLOWED_CLIS) {
    try {
      execFileSync(binary, ["--version"], { stdio: "ignore" });
      status[binary] = true;
    } catch {
      status[binary] = false;
    }
  }
  return status;
}

function escapeTsString(value: string): string {
  return JSON.stringify(value);
}

function main(): void {
  const { values } = parseArgs({
    options: {
      name: { type: "string" },
      slug: { type: "string" },
      tagline: { type: "string" },
      billing: { type: "string" },
      "price-cents": { type: "string" },
      auth: { type: "string" },
      tunnel: { type: "string" },
      mcp: { type: "string" },
      lang: { type: "string" },
      "init-specs": { type: "string" },
    },
    strict: false,
  });

  const parsed = cliSchema.safeParse({
    name: values.name,
    slug: values.slug,
    tagline: values.tagline,
    billing: values.billing,
    priceCents: values["price-cents"],
    auth: values.auth,
    tunnel: values.tunnel,
    mcp: values.mcp,
    lang: values.lang,
    initSpecs: values["init-specs"],
  });

  if (!parsed.success) {
    console.error("Invalid arguments:", z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
  }

  const cfg = parsed.data;
  const rootDir = process.cwd();

  // 1. Update package.json name
  const pkgPath = resolve(rootDir, "package.json");
  const pkgJson = JSON.parse(readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
  pkgJson.name = cfg.slug;
  writeFileSync(pkgPath, `${JSON.stringify(pkgJson, null, 2)}\n`, "utf8");

  // 2. Update src/config/site.ts core fields using function replacers (immune to $ substitution)
  const sitePath = resolve(rootDir, "src/config/site.ts");
  let siteSource = readFileSync(sitePath, "utf8");
  const stripeMode = cfg.billing === "subscription" ? "subscription" : "payment";
  siteSource = siteSource
    .replace(/name:\s*"[^"]*"/, () => `name: ${escapeTsString(cfg.name)}`)
    .replace(/slug:\s*"[^"]*"/, () => `slug: ${escapeTsString(cfg.slug)}`)
    .replace(/tagline:\s*"[^"]*"/, () => `tagline: ${escapeTsString(cfg.tagline)}`)
    .replace(/locale:\s*"(fr|en)"/, () => `locale: ${escapeTsString(cfg.lang)}`)
    .replace(/authMode:\s*"[^"]*"/, () => `authMode: ${escapeTsString(cfg.auth)}`)
    .replace(/tunnelVariant:\s*"[^"]*"/, () => `tunnelVariant: ${escapeTsString(cfg.tunnel)}`)
    .replace(/billingMode:\s*"[^"]*"/, () => `billingMode: ${escapeTsString(cfg.billing)}`)
    .replace(/mcpEnabled:\s*(true|false)/, () => `mcpEnabled: ${String(cfg.mcp)}`)
    .replace(/priceCents:\s*\d+/, () => `priceCents: ${cfg.priceCents}`)
    .replace(/mode:\s*"(payment|subscription)"/g, () => `mode: ${escapeTsString(stripeMode)}`);
  writeFileSync(sitePath, siteSource, "utf8");

  // 3. Create .env.local from .env.example if absent
  const envExample = resolve(rootDir, ".env.example");
  const envLocal = resolve(rootDir, ".env.local");
  if (existsSync(envExample) && !existsSync(envLocal)) {
    copyFileSync(envExample, envLocal);
  }

  // 4. Copy selected SDD templates into specs/
  const templatesDir = resolve(rootDir, "specs/templates");
  const specsDir = resolve(rootDir, "specs");
  mkdirSync(specsDir, { recursive: true });
  const filesToCopy: ReadonlyArray<readonly [string, string]> =
    cfg.initSpecs === "24h"
      ? [
          ["SPRINT_24H_TEMPLATE.md", "SPRINT_24H.md"],
          ["STATUT_TEMPLATE.md", "STATUT.md"],
          ["CARNET_DE_BORD_TEMPLATE.md", "CARNET_DE_BORD.md"],
        ]
      : [
          ["00_PRD_TEMPLATE.md", "00_PRD.md"],
          ["01_ARCHITECTURE_TEMPLATE.md", "01_ARCHITECTURE.md"],
          ["02_DATABASE_RLS_TEMPLATE.md", "02_DATABASE_RLS.md"],
          ["03_DESIGN_SYSTEM_TEMPLATE.md", "03_DESIGN_SYSTEM.md"],
          ["04_TRACKING_LEGAL_TEMPLATE.md", "04_TRACKING_LEGAL.md"],
          ["AI_AGENTS_GUIDE_TEMPLATE.md", "AI_AGENTS_GUIDE.md"],
          ["ROADMAP_TICKETS_TEMPLATE.md", "ROADMAP_TICKETS.md"],
          ["STATUT_TEMPLATE.md", "STATUT.md"],
          ["CARNET_DE_BORD_TEMPLATE.md", "CARNET_DE_BORD.md"],
        ];

  for (const [srcName, destName] of filesToCopy) {
    const srcFile = resolve(templatesDir, srcName);
    const destFile = resolve(specsDir, destName);
    if (existsSync(srcFile) && !existsSync(destFile)) {
      copyFileSync(srcFile, destFile);
    }
  }

  // 5. Update README.md preserving FounderRace Art. 7 citation
  const readmePath = resolve(rootDir, "README.md");
  const readmeContent = `# ${cfg.name}

${cfg.tagline}

## Boilerplate Attribution (FounderRace Art. 7)

This project was bootstrapped from the public generic boilerplate:
- **Repository**: https://github.com/juliennoel22/saas-juliennoel-fr-boilerplate
- **Scope**: Generic Next.js 16 + Supabase + Stripe Hosted Checkout + AI SDK infrastructure (zero product-specific business logic prior to launch).

## Local Development

\`\`\`bash
npm install
npm run dev
npm run check
\`\`\`
`;
  writeFileSync(readmePath, readmeContent, "utf8");

  // 6. Report CLI status and exact manual commands
  const cliStatus = checkCliAvailability();
  console.info("\nSetup completed for:", cfg.name, `(${cfg.slug})`);
  console.info("CLI readiness:", cliStatus);
  console.info("\nNext manual commands:");
  console.info(`  gh repo create juliennoel22/${cfg.slug} --public --source=. --remote=origin`);
  console.info("  npx supabase link && npx supabase db push");
  console.info("  vercel link && vercel env pull");
  console.info("  npm run check");
}

main();
