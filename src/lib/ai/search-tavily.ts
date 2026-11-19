import { z } from "zod";
import { getServerEnv } from "@/lib/env";
import { sanitizePlainText } from "@/lib/security";
import { err, ok, type Result } from "@/types/result";

const tavilyResultItemSchema = z.object({
  title: z.string(),
  url: z.url(),
  content: z.string(),
  score: z.number().optional(),
});

const tavilyResponseSchema = z.object({
  query: z.string(),
  answer: z.string().optional(),
  results: z.array(tavilyResultItemSchema).default([]),
});

export type TavilySearchResponse = z.infer<typeof tavilyResponseSchema>;

export interface TavilySearchOptions {
  readonly query: string;
  readonly maxResults?: number;
  readonly searchDepth?: "basic" | "advanced";
  readonly includeAnswer?: boolean;
}

export async function searchTavily(
  options: TavilySearchOptions,
): Promise<Result<TavilySearchResponse, string>> {
  const env = getServerEnv();
  if (!env.TAVILY_API_KEY) {
    return err("TAVILY_API_KEY is not configured.");
  }

  const cleanQuery = sanitizePlainText(options.query, 400);
  if (cleanQuery.length < 2) {
    return err("La requête de recherche est trop courte.");
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query: cleanQuery,
        max_results: Math.min(10, Math.max(1, options.maxResults ?? 5)),
        search_depth: options.searchDepth ?? "basic",
        include_answer: options.includeAnswer ?? false,
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return err(`Tavily API returned HTTP ${response.status}.`);
    }

    const rawJson: unknown = await response.json();
    const parsed = tavilyResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      return err("Réponse Tavily invalide.");
    }

    return ok(parsed.data);
  } catch {
    return err("Erreur réseau lors de la recherche Tavily.");
  }
}
