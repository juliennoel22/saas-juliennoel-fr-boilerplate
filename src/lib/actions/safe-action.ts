import type { User } from "@supabase/supabase-js";
import type { z } from "zod";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { err, type Result } from "@/types/result";

export interface ActionError {
  readonly code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "INTERNAL_ERROR" | "DOMAIN_ERROR";
  readonly message: string;
}

export function createPublicAction<TSchema extends z.ZodType, TOutput>(
  schema: TSchema,
  handler: (input: z.infer<TSchema>) => Promise<Result<TOutput, ActionError>>,
): (rawInput: unknown) => Promise<Result<TOutput, ActionError>> {
  return async (rawInput: unknown): Promise<Result<TOutput, ActionError>> => {
    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_ERROR",
        message: "Données d'entrée invalides.",
      });
    }

    try {
      return await handler(parsed.data);
    } catch {
      return err({
        code: "INTERNAL_ERROR",
        message: "Une erreur technique est survenue. Réessayez dans un instant.",
      });
    }
  };
}

export function createAuthAction<TSchema extends z.ZodType, TOutput>(
  schema: TSchema,
  handler: (input: z.infer<TSchema>, ctx: { user: User }) => Promise<Result<TOutput, ActionError>>,
): (rawInput: unknown) => Promise<Result<TOutput, ActionError>> {
  return async (rawInput: unknown): Promise<Result<TOutput, ActionError>> => {
    const user = await getAuthenticatedUser();
    if (!user) {
      return err({
        code: "UNAUTHORIZED",
        message: "Authentification requise.",
      });
    }

    const parsed = schema.safeParse(rawInput);
    if (!parsed.success) {
      return err({
        code: "VALIDATION_ERROR",
        message: "Données d'entrée invalides.",
      });
    }

    try {
      return await handler(parsed.data, { user });
    } catch {
      return err({
        code: "INTERNAL_ERROR",
        message: "Une erreur technique est survenue. Réessayez dans un instant.",
      });
    }
  };
}
