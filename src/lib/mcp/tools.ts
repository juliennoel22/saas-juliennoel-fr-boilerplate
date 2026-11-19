import { z } from "zod";
import { siteConfig } from "@/config/site";

export interface McpToolContext {
  readonly requestId: string;
}

export interface McpToolDefinition<TSchema extends z.ZodType = z.ZodType> {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: TSchema;
  readonly execute: (input: z.infer<TSchema>, ctx: McpToolContext) => Promise<unknown>;
}

const appStatusInputSchema = z.object({
  includeFeatures: z.boolean().optional().default(false),
});

export const mcpTools: readonly McpToolDefinition[] = [
  {
    name: "app_status",
    description: "Returns application identity, availability status, and ISO timestamp.",
    inputSchema: appStatusInputSchema,
    execute: async (rawInput) => {
      const input = appStatusInputSchema.parse(rawInput);
      return {
        app: siteConfig.name,
        slug: siteConfig.slug,
        status: "ok",
        timestamp: new Date().toISOString(),
        ...(input.includeFeatures
          ? {
              features: {
                mcpEnabled: siteConfig.features.mcpEnabled,
                billingMode: siteConfig.billingMode,
                authMode: siteConfig.authMode,
              },
            }
          : {}),
      };
    },
  },
];

export function listMcpToolsJsonSchema(): Array<{
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}> {
  return mcpTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: z.toJSONSchema(tool.inputSchema) as Record<string, unknown>,
  }));
}

export function findMcpTool(name: string): McpToolDefinition | undefined {
  return mcpTools.find((tool) => tool.name === name);
}
