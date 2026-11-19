import { generateText, Output } from "ai";
import type { z } from "zod";
import {
  type ResolvedAiTarget,
  resolveFallbackAiTarget,
  resolvePrimaryAiTarget,
} from "@/lib/ai/provider";
import type { AiProviderName } from "@/lib/env";
import { err, ok, type Result } from "@/types/result";

export interface AiUsageMeta {
  readonly provider: AiProviderName;
  readonly model: string;
  readonly usedFallback: boolean;
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export interface AiError {
  readonly code: "NOT_CONFIGURED" | "PROVIDER_FAILED" | "SCHEMA_VALIDATION_FAILED";
  readonly message: string;
}

export interface GenerateStructuredOptions<TSchema extends z.ZodType> {
  readonly schema: TSchema;
  readonly system: string;
  readonly prompt: string;
  readonly temperature?: number;
  readonly maxRetries?: number;
  readonly timeoutMs?: number;
  readonly providerOverride?: AiProviderName;
  readonly modelOverride?: string;
}

export interface StructuredExecutorInput<TSchema extends z.ZodType> {
  readonly target: ResolvedAiTarget;
  readonly schema: TSchema;
  readonly system: string;
  readonly prompt: string;
  readonly temperature: number;
  readonly maxRetries: number;
  readonly timeoutMs: number;
}

export interface StructuredExecutorOutput {
  readonly rawOutput: unknown;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

export type StructuredExecutor = <TSchema extends z.ZodType>(
  input: StructuredExecutorInput<TSchema>,
) => Promise<StructuredExecutorOutput>;

const DEFAULT_TIMEOUT_MS = 25_000;
const MAX_ALLOWED_RETRIES = 2;

const defaultExecutor: StructuredExecutor = async ({
  target,
  schema,
  system,
  prompt,
  temperature,
  maxRetries,
  timeoutMs,
}) => {
  const response = await generateText({
    model: target.model,
    system,
    prompt,
    temperature,
    maxRetries,
    abortSignal: AbortSignal.timeout(timeoutMs),
    output: Output.object({ schema }),
  });

  return {
    rawOutput: response.output,
    inputTokens: response.usage.inputTokens ?? 0,
    outputTokens: response.usage.outputTokens ?? 0,
  };
};

async function runTarget<TSchema extends z.ZodType>(
  target: ResolvedAiTarget,
  options: GenerateStructuredOptions<TSchema>,
  executor: StructuredExecutor,
  usedFallback: boolean,
): Promise<Result<{ data: z.infer<TSchema>; usage: AiUsageMeta }, AiError>> {
  const startedAt = Date.now();
  const boundedRetries = Math.min(MAX_ALLOWED_RETRIES, Math.max(0, options.maxRetries ?? 1));

  try {
    const execution = await executor({
      target,
      schema: options.schema,
      system: options.system,
      prompt: options.prompt,
      temperature: options.temperature ?? 0.2,
      maxRetries: boundedRetries,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    });

    const parsed = options.schema.safeParse(execution.rawOutput);
    if (!parsed.success) {
      return err({
        code: "SCHEMA_VALIDATION_FAILED",
        message: "La réponse du modèle ne respecte pas le schéma attendu.",
      });
    }

    return ok({
      data: parsed.data,
      usage: {
        provider: target.provider,
        model: target.modelId,
        usedFallback,
        latencyMs: Math.max(0, Date.now() - startedAt),
        inputTokens: execution.inputTokens,
        outputTokens: execution.outputTokens,
      },
    });
  } catch {
    return err({
      code: "PROVIDER_FAILED",
      message: "Le service IA est temporairement indisponible.",
    });
  }
}

export async function generateStructuredWithTargets<TSchema extends z.ZodType>(
  options: GenerateStructuredOptions<TSchema>,
  targets: { primary: ResolvedAiTarget; fallback?: ResolvedAiTarget | null },
  executor: StructuredExecutor = defaultExecutor,
): Promise<Result<{ data: z.infer<TSchema>; usage: AiUsageMeta }, AiError>> {
  const primaryResult = await runTarget(targets.primary, options, executor, false);
  if (primaryResult.ok) {
    return primaryResult;
  }

  if (targets.fallback) {
    return runTarget(targets.fallback, options, executor, true);
  }

  return primaryResult;
}

export async function generateStructured<TSchema extends z.ZodType>(
  options: GenerateStructuredOptions<TSchema>,
): Promise<Result<{ data: z.infer<TSchema>; usage: AiUsageMeta }, AiError>> {
  const primaryTarget = resolvePrimaryAiTarget({
    provider: options.providerOverride,
    model: options.modelOverride,
  });

  if (!primaryTarget.ok) {
    return err({
      code: "NOT_CONFIGURED",
      message: primaryTarget.error,
    });
  }

  const fallbackTarget = resolveFallbackAiTarget();
  return generateStructuredWithTargets(options, {
    primary: primaryTarget.data,
    fallback: fallbackTarget,
  });
}

export function computeCreditsAfterDeduction(
  currentCredits: number,
  cost: number,
): Result<number, string> {
  if (!Number.isInteger(currentCredits) || currentCredits < 0) {
    return err("Solde de crédits invalide.");
  }
  if (!Number.isInteger(cost) || cost <= 0) {
    return err("Coût d'opération invalide.");
  }
  if (currentCredits < cost) {
    return err("Crédits insuffisants.");
  }
  return ok(currentCredits - cost);
}
