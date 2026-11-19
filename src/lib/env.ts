import { z } from "zod";
import { err, ok, type Result } from "@/types/result";

const optionalNonEmpty = z.preprocess(
  (val) => (typeof val === "string" && val.trim().length > 0 ? val.trim() : undefined),
  z.string().optional(),
);

const defaultedString = (fallback: string) =>
  z.preprocess(
    (val) => (typeof val === "string" && val.trim().length > 0 ? val.trim() : fallback),
    z.string(),
  );

const aiProviderEnum = z.enum([
  "openrouter",
  "google",
  "openai",
  "mistral",
  "anthropic",
]);

const optionalAiProvider = z.preprocess(
  (val) => (typeof val === "string" && val.trim().length > 0 ? val.trim().toLowerCase() : undefined),
  aiProviderEnum.optional().catch(undefined),
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: defaultedString("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: optionalNonEmpty,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmpty,
  NEXT_PUBLIC_POSTHOG_KEY: optionalNonEmpty,
  NEXT_PUBLIC_POSTHOG_HOST: defaultedString("https://us.i.posthog.com"),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,
  STRIPE_SECRET_KEY: optionalNonEmpty,
  STRIPE_WEBHOOK_SECRET: optionalNonEmpty,
  STRIPE_PRICE_ID_STARTER: optionalNonEmpty,
  STRIPE_PRICE_ID_PRO: optionalNonEmpty,
  AI_PROVIDER: optionalAiProvider,
  AI_MODEL: optionalNonEmpty,
  AI_API_KEY: optionalNonEmpty,
  OPENROUTER_API_KEY: optionalNonEmpty,
  OPENROUTER_BASE_URL: defaultedString("https://openrouter.ai/api/v1"),
  GOOGLE_GENERATIVE_AI_API_KEY: optionalNonEmpty,
  OPENAI_API_KEY: optionalNonEmpty,
  MISTRAL_API_KEY: optionalNonEmpty,
  ANTHROPIC_API_KEY: optionalNonEmpty,
  AI_FALLBACK_PROVIDER: optionalAiProvider,
  AI_FALLBACK_MODEL: optionalNonEmpty,
  TAVILY_API_KEY: optionalNonEmpty,
  RESEND_API_KEY: optionalNonEmpty,
  RESEND_FROM_EMAIL: defaultedString("noreply@example.com"),
  POSTHOG_EXCLUDED_EMAILS: optionalNonEmpty,
  VIP_BYPASS_CODES: optionalNonEmpty,
  MCP_API_KEY: optionalNonEmpty,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type AiProviderName = z.infer<typeof aiProviderEnum>;

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });

  if (parsed.success) {
    return parsed.data;
  }

  return {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    NEXT_PUBLIC_POSTHOG_KEY: undefined,
    NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  };
}

export function getServerEnv(): ServerEnv {
  return serverEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID_STARTER: process.env.STRIPE_PRICE_ID_STARTER,
    STRIPE_PRICE_ID_PRO: process.env.STRIPE_PRICE_ID_PRO,
    AI_PROVIDER: process.env.AI_PROVIDER,
    AI_MODEL: process.env.AI_MODEL,
    AI_API_KEY: process.env.AI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_FALLBACK_PROVIDER: process.env.AI_FALLBACK_PROVIDER,
    AI_FALLBACK_MODEL: process.env.AI_FALLBACK_MODEL,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    POSTHOG_EXCLUDED_EMAILS: process.env.POSTHOG_EXCLUDED_EMAILS,
    VIP_BYPASS_CODES: process.env.VIP_BYPASS_CODES,
    MCP_API_KEY: process.env.MCP_API_KEY,
  });
}

export function requireEnvKey<K extends keyof ServerEnv>(
  key: K,
): Result<NonNullable<ServerEnv[K]>, string> {
  const env = getServerEnv();
  const value = env[key];
  if (!value) {
    return err(`Missing required environment variable: ${String(key)}`);
  }
  return ok(value as NonNullable<ServerEnv[K]>);
}

export function getEnvReadiness(): {
  supabase: boolean;
  stripe: boolean;
  ai: boolean;
  posthog: boolean;
  resend: boolean;
  tavily: boolean;
} {
  const env = getServerEnv();
  return {
    supabase: Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    stripe: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
    ai: Boolean(
      env.AI_API_KEY ||
        env.OPENROUTER_API_KEY ||
        env.GOOGLE_GENERATIVE_AI_API_KEY ||
        env.OPENAI_API_KEY ||
        env.MISTRAL_API_KEY ||
        env.ANTHROPIC_API_KEY,
    ),
    posthog: Boolean(env.NEXT_PUBLIC_POSTHOG_KEY),
    resend: Boolean(env.RESEND_API_KEY),
    tavily: Boolean(env.TAVILY_API_KEY),
  };
}
