import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";
import { getEnvReadiness } from "@/lib/env";

export async function GET(): Promise<NextResponse> {
  const isProd = process.env.NODE_ENV === "production";
  return NextResponse.json(
    {
      status: "ok",
      app: siteConfig.slug,
      timestamp: new Date().toISOString(),
      ...(isProd ? {} : { services: getEnvReadiness() }),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
