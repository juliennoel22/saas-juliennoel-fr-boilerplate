import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

interface ToolCheck {
  readonly name: string;
  readonly args: readonly string[];
  readonly hint: string;
}

const TOOLS: readonly ToolCheck[] = [
  { name: "node", args: ["-v"], hint: "Install Node.js >= 20" },
  { name: "npm", args: ["-v"], hint: "Install npm" },
  { name: "git", args: ["--version"], hint: "Install git" },
  { name: "gh", args: ["auth", "status"], hint: "Run: gh auth login" },
  { name: "supabase", args: ["projects", "list"], hint: "Run: supabase login" },
  { name: "vercel", args: ["whoami"], hint: "Run: vercel login" },
  { name: "stripe", args: ["--version"], hint: "Install Stripe CLI or configure .env.local" },
  { name: "cloudflared", args: ["--version"], hint: "Optional: install cloudflared for mobile HTTPS tunnels" },
];

function runCheck(tool: ToolCheck): { ok: boolean } {
  try {
    execFileSync(tool.name, [...tool.args], { stdio: "ignore" });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

function main(): void {
  const rootDir = process.cwd();
  console.info("=== Boilerplate Environment Doctor ===");

  for (const tool of TOOLS) {
    const res = runCheck(tool);
    console.info(`  [${res.ok ? "OK" : "MISSING/UNAUTH"}] ${tool.name}${res.ok ? "" : ` -> ${tool.hint}`}`);
  }

  const envPath = resolve(rootDir, ".env.local");
  if (!existsSync(envPath)) {
    console.info("  [INFO] .env.local not found (copy .env.example or run npm run setup:race)");
  } else {
    const envText = readFileSync(envPath, "utf8");
    const hasSupabase = envText.includes("supabase.co") && !envText.includes("your-project-ref");
    const hasStripe = envText.includes("STRIPE_SECRET_KEY=") && !envText.includes("<STRIPE_SECRET_KEY>");
    console.info("  [.env.local]", { hasSupabase, hasStripe });
  }

  const mcpPath = resolve(rootDir, ".mcp.json");
  if (existsSync(mcpPath)) {
    const mcpText = readFileSync(mcpPath, "utf8");
    const hasPlaceholders = mcpText.includes("<STRIPE_") || mcpText.includes("<POSTHOG_");
    console.info("  [.mcp.json]", {
      configuredPlaceholdersRemaining: hasPlaceholders,
    });
  }
}

main();
