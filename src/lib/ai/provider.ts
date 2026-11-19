import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogle } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { type AiProviderName, getServerEnv, type ServerEnv } from "@/lib/env";
import { err, ok, type Result } from "@/types/result";

export interface ResolvedAiTarget {
  readonly provider: AiProviderName;
  readonly modelId: string;
  readonly model: LanguageModel;
}

const DEFAULT_MODELS: Record<AiProviderName, string> = {
  openrouter: "google/gemini-2.5-flash",
  google: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  mistral: "mistral-small-latest",
  anthropic: "claude-haiku-4-5",
};

function getProviderApiKey(
  provider: AiProviderName,
  env: ServerEnv,
  allowSharedKey: boolean,
): string | undefined {
  const dedicated: Record<AiProviderName, string | undefined> = {
    openrouter: env.OPENROUTER_API_KEY,
    google: env.GOOGLE_GENERATIVE_AI_API_KEY,
    openai: env.OPENAI_API_KEY,
    mistral: env.MISTRAL_API_KEY,
    anthropic: env.ANTHROPIC_API_KEY,
  };
  return dedicated[provider] ?? (allowSharedKey ? env.AI_API_KEY : undefined);
}

export function detectConfiguredProvider(env: ServerEnv = getServerEnv()): AiProviderName | null {
  if (env.AI_PROVIDER) {
    return env.AI_PROVIDER;
  }
  const order: readonly AiProviderName[] = [
    "openrouter",
    "google",
    "openai",
    "mistral",
    "anthropic",
  ];
  for (const candidate of order) {
    if (getProviderApiKey(candidate, env, false)) {
      return candidate;
    }
  }
  return env.AI_API_KEY ? "openrouter" : null;
}

function buildLanguageModel(
  provider: AiProviderName,
  modelId: string,
  apiKey: string,
  env: ServerEnv,
): LanguageModel {
  switch (provider) {
    case "openrouter": {
      const client = createOpenAICompatible({
        name: "openrouter",
        baseURL: env.OPENROUTER_BASE_URL,
        apiKey,
        supportsStructuredOutputs: true,
      });
      return client(modelId);
    }
    case "google": {
      const client = createGoogle({ apiKey });
      return client(modelId);
    }
    case "openai": {
      const client = createOpenAI({ apiKey });
      return client(modelId);
    }
    case "mistral": {
      const client = createMistral({ apiKey });
      return client(modelId);
    }
    case "anthropic": {
      const client = createAnthropic({ apiKey });
      return client(modelId);
    }
  }
}

export function resolvePrimaryAiTarget(
  overrides?: { provider?: AiProviderName; model?: string },
  env: ServerEnv = getServerEnv(),
): Result<ResolvedAiTarget, string> {
  const provider = overrides?.provider ?? detectConfiguredProvider(env);
  if (!provider) {
    return err("No AI provider API key is configured.");
  }

  const useEnvPrimary = !overrides?.provider || overrides.provider === env.AI_PROVIDER;
  const apiKey = getProviderApiKey(provider, env, useEnvPrimary);
  if (!apiKey) {
    return err(`Missing API key for AI provider "${provider}".`);
  }

  const modelId = overrides?.model ?? (useEnvPrimary ? env.AI_MODEL : undefined) ?? DEFAULT_MODELS[provider];
  return ok({
    provider,
    modelId,
    model: buildLanguageModel(provider, modelId, apiKey, env),
  });
}

export function resolveFallbackAiTarget(
  env: ServerEnv = getServerEnv(),
): ResolvedAiTarget | null {
  if (!env.AI_FALLBACK_PROVIDER) {
    return null;
  }

  const apiKey = getProviderApiKey(env.AI_FALLBACK_PROVIDER, env, false);
  if (!apiKey) {
    return null;
  }

  const modelId = env.AI_FALLBACK_MODEL ?? DEFAULT_MODELS[env.AI_FALLBACK_PROVIDER];
  return {
    provider: env.AI_FALLBACK_PROVIDER,
    modelId,
    model: buildLanguageModel(env.AI_FALLBACK_PROVIDER, modelId, apiKey, env),
  };
}
