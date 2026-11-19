import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { getServerEnv } from "@/lib/env";
import { findMcpTool, listMcpToolsJsonSchema } from "@/lib/mcp/tools";
import { checkRateLimit, getClientIp, safeTimingEqual } from "@/lib/security";

const PROTOCOL_VERSION = "2025-03-26";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const jsonRpcSchema = z.object({
  jsonrpc: z.literal("2.0"),
  id: z.union([z.string(), z.number(), z.null()]).optional(),
  method: z.string().min(1).max(120),
  params: z.record(z.string(), z.unknown()).optional(),
});

const toolCallParamsSchema = z.object({
  name: z.string().min(1).max(120),
  arguments: z.unknown().optional(),
});

function jsonRpcError(
  id: string | number | null | undefined,
  code: number,
  message: string,
  status = 200,
): NextResponse {
  return NextResponse.json(
    { jsonrpc: "2.0", id: id ?? null, error: { code, message } },
    { status, headers: NO_STORE_HEADERS },
  );
}

function validateMcpOrigin(request: Request, expectedAppUrl: string): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Non-browser MCP CLI/IDE clients omit Origin
  try {
    const parsedOrigin = new URL(origin);
    const expected = new URL(expectedAppUrl);
    if (parsedOrigin.origin === expected.origin) return true;
    return (
      process.env.NODE_ENV !== "production" &&
      (parsedOrigin.hostname === "localhost" || parsedOrigin.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function checkMcpAuth(request: Request): "ok" | "unconfigured" | "unauthorized" {
  const apiKey = getServerEnv().MCP_API_KEY;
  // Fail closed when MCP is enabled without MCP_API_KEY configured.
  if (!apiKey) return "unconfigured";
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return "unauthorized";
  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 && safeTimingEqual(token, apiKey) ? "ok" : "unauthorized";
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!siteConfig.features.mcpEnabled) {
    return NextResponse.json({ error: "MCP endpoint disabled." }, { status: 404 });
  }

  const rate = checkRateLimit(`mcp:${getClientIp(request)}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });
  }

  const env = getServerEnv();
  if (!validateMcpOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return NextResponse.json({ error: "Forbidden origin." }, { status: 403 });
  }

  const authStatus = checkMcpAuth(request);
  if (authStatus === "unconfigured") {
    return NextResponse.json({ error: "MCP_API_KEY is not configured." }, { status: 503 });
  }
  if (authStatus === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(
    {
      name: siteConfig.slug,
      protocolVersion: PROTOCOL_VERSION,
      transport: "streamable-http",
      tools: listMcpToolsJsonSchema().map((tool) => tool.name),
    },
    { status: 200, headers: NO_STORE_HEADERS },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!siteConfig.features.mcpEnabled) {
    return NextResponse.json({ error: "MCP endpoint disabled." }, { status: 404 });
  }

  const rate = checkRateLimit(`mcp:${getClientIp(request)}`, 60, 60_000);
  if (!rate.allowed) {
    return jsonRpcError(null, -32000, "Rate limit exceeded.", 429);
  }

  const env = getServerEnv();
  if (!validateMcpOrigin(request, env.NEXT_PUBLIC_APP_URL)) {
    return jsonRpcError(null, -32000, "Forbidden origin.", 403);
  }

  const authStatus = checkMcpAuth(request);
  if (authStatus === "unconfigured") {
    return jsonRpcError(null, -32000, "MCP_API_KEY is not configured.", 503);
  }
  if (authStatus === "unauthorized") {
    return jsonRpcError(null, -32001, "Unauthorized.", 401);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error", 400);
  }

  const parsed = jsonRpcSchema.safeParse(body);
  if (!parsed.success) {
    return jsonRpcError(null, -32600, "Invalid Request", 400);
  }

  const { id, method, params } = parsed.data;

  switch (method) {
    case "initialize":
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: {
            protocolVersion: PROTOCOL_VERSION,
            capabilities: { tools: {} },
            serverInfo: { name: siteConfig.slug, version: "0.1.0" },
          },
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );

    case "notifications/initialized":
      return new NextResponse(null, { status: 202, headers: NO_STORE_HEADERS });

    case "tools/list":
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: id ?? null,
          result: { tools: listMcpToolsJsonSchema() },
        },
        { status: 200, headers: NO_STORE_HEADERS },
      );

    case "tools/call": {
      const parsedCall = toolCallParamsSchema.safeParse(params);
      if (!parsedCall.success) return jsonRpcError(id, -32602, "Invalid tool call params");

      const tool = findMcpTool(parsedCall.data.name);
      if (!tool) return jsonRpcError(id, -32601, `Unknown tool: ${parsedCall.data.name}`);

      const parsedArgs = tool.inputSchema.safeParse(parsedCall.data.arguments ?? {});
      if (!parsedArgs.success) return jsonRpcError(id, -32602, "Invalid tool arguments");

      try {
        const output = await tool.execute(parsedArgs.data, { requestId: randomUUID() });
        return NextResponse.json(
          {
            jsonrpc: "2.0",
            id: id ?? null,
            result: { content: [{ type: "text", text: JSON.stringify(output, null, 2) }] },
          },
          { status: 200, headers: NO_STORE_HEADERS },
        );
      } catch {
        return jsonRpcError(id, -32603, "Internal tool execution error");
      }
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}
