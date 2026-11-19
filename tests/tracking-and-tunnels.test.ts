import { describe, expect, it } from "vitest";
import { siteConfig } from "@/config/site";
import { extractUtmFromSearch } from "@/lib/posthog/events";

describe("Tracking UTM Extraction & Tunnel Configuration", () => {
  it("extracts and bounds UTM parameters from query strings", () => {
    const utm = extractUtmFromSearch(
      "?utm_source=tiktok&utm_medium=cpc&utm_campaign=launch_24h&utm_content=hook_1&utm_term=saas",
    );

    expect(utm).toEqual({
      source: "tiktok",
      medium: "cpc",
      campaign: "launch_24h",
      content: "hook_1",
      term: "saas",
    });

    const emptyUtm = extractUtmFromSearch("?foo=bar");
    expect(emptyUtm).toEqual({});
  });

  it("exposes valid default tunnel variant and hard paywall config", () => {
    expect(["input", "quiz", "upload", "audit"]).toContain(siteConfig.tunnelVariant);
    expect(siteConfig.legal.requiresImmediateExecutionWaiver).toBe(true);
    expect(siteConfig.plans.starter.priceCents).toBeGreaterThanOrEqual(100);
    expect(siteConfig.plans.pro.priceCents).toBeGreaterThanOrEqual(100);
  });
});
