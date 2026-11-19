import type { LanguageModel } from "ai";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  computeCreditsAfterDeduction,
  generateStructuredWithTargets,
  type StructuredExecutor,
} from "@/lib/ai/generate";
import {
  detectConfiguredProvider,
  type ResolvedAiTarget,
  resolvePrimaryAiTarget,
} from "@/lib/ai/provider";
import type { ServerEnv } from "@/lib/env";

const sampleSchema = z.object({
  summary: z.string().min(3),
  score: z.number().int().min(0).max(100),
});

const dummyModel = {} as LanguageModel;

const primaryTarget: ResolvedAiTarget = {
  provider: "openrouter",
  modelId: "google/gemini-2.5-flash",
  model: dummyModel,
};

const fallbackTarget: ResolvedAiTarget = {
  provider: "mistral",
  modelId: "mistral-small-latest",
  model: dummyModel,
};

describe("AI Structured Layer & Credit Math", () => {
  it("parses valid structured output and reports usage metadata", async () => {
    const executor: StructuredExecutor = async () => ({
      rawOutput: { summary: "Valid result", score: 92 },
      inputTokens: 120,
      outputTokens: 35,
    });

    const result = await generateStructuredWithTargets(
      { schema: sampleSchema, system: "sys", prompt: "user" },
      { primary: primaryTarget },
      executor,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.data).toEqual({ summary: "Valid result", score: 92 });
      expect(result.data.usage.usedFallback).toBe(false);
      expect(result.data.usage.provider).toBe("openrouter");
      expect(result.data.usage.inputTokens).toBe(120);
    }
  });

  it("falls back automatically when primary provider fails or returns invalid schema", async () => {
    let calls = 0;
    const executor: StructuredExecutor = async ({ target }) => {
      calls += 1;
      if (target.provider === "openrouter") {
        throw new Error("503 upstream timeout");
      }
      return {
        rawOutput: { summary: "Fallback succeeded", score: 88 },
        inputTokens: 80,
        outputTokens: 20,
      };
    };

    const result = await generateStructuredWithTargets(
      { schema: sampleSchema, system: "sys", prompt: "user" },
      { primary: primaryTarget, fallback: fallbackTarget },
      executor,
    );

    expect(calls).toBe(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.usage.usedFallback).toBe(true);
      expect(result.data.usage.provider).toBe("mistral");
    }
  });

  it("rejects malformed model payloads during post-inference Zod validation", async () => {
    const executor: StructuredExecutor = async () => ({
      rawOutput: { summary: "ok", score: 999 },
      inputTokens: 10,
      outputTokens: 10,
    });

    const result = await generateStructuredWithTargets(
      { schema: sampleSchema, system: "sys", prompt: "user" },
      { primary: primaryTarget },
      executor,
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("SCHEMA_VALIDATION_FAILED");
    }
  });

  it("auto-detects configured AI provider from available API keys", () => {
    const baseEnv: ServerEnv = {
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
      OPENROUTER_BASE_URL: "https://openrouter.ai/api/v1",
      RESEND_FROM_EMAIL: "noreply@example.com",
      MISTRAL_API_KEY: "dummy-mistral-key",
    };

    expect(detectConfiguredProvider(baseEnv)).toBe("mistral");
    expect(detectConfiguredProvider({ ...baseEnv, AI_PROVIDER: "anthropic" })).toBe("anthropic");

    const overrideTarget = resolvePrimaryAiTarget(
      { provider: "mistral" },
      {
        ...baseEnv,
        AI_PROVIDER: "openrouter",
        AI_MODEL: "google/gemini-2.5-flash",
        OPENROUTER_API_KEY: "dummy-openrouter-key",
      },
    );
    expect(overrideTarget.ok).toBe(true);
    if (overrideTarget.ok) {
      expect(overrideTarget.data.modelId).toBe("mistral-small-latest");
    }
  });

  it("computes atomic credit deduction safely without negative balances", () => {
    expect(computeCreditsAfterDeduction(20, 5)).toEqual({ ok: true, data: 15 });
    expect(computeCreditsAfterDeduction(2, 5).ok).toBe(false);
    expect(computeCreditsAfterDeduction(10, 0).ok).toBe(false);
    expect(computeCreditsAfterDeduction(-1, 1).ok).toBe(false);
  });
});
