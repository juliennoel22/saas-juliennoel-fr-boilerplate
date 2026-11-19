import type { MetadataRoute } from "next";
import { getPublicEnv } from "@/lib/env";

/**
 * Explicitly permits all crawlers and screenshot bots on public routes
 * (FounderRace Art. 6 compatibility).
 */
export default function robots(): MetadataRoute.Robots {
  const appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/webhooks/", "/dashboard"],
      },
    ],
    host: appUrl,
  };
}
