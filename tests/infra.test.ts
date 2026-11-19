import { describe, expect, it } from "vitest";
import { formatPrice, siteConfig } from "@/config/site";
import { isAllowedMimeType, uploadConfig } from "@/config/uploads";
import { getEnvReadiness, getPublicEnv } from "@/lib/env";
import { isTestTraffic } from "@/lib/posthog/firewall";
import {
  checkRateLimit,
  isValidUUID,
  maskEmail,
  matchesAllowedSecret,
  safeTimingEqual,
  sanitizePlainText,
  sanitizeRedirectPath,
  sanitizeUrl,
  signVipToken,
  validateSameOrigin,
  verifyVipToken,
} from "@/lib/security";
import { computeStripeAmountCents } from "@/lib/stripe/checkout";
import { err, isErr, isOk, ok } from "@/types/result";

describe("Infrastructure & Security Primitives", () => {
  it("validates UUIDs strictly to prevent Postgres 22P02 errors", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isValidUUID("not-a-uuid")).toBe(false);
    expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000Z")).toBe(false);
    expect(isValidUUID(null)).toBe(false);
  });

  it("sanitizes plain text, URLs, and redirect paths against XSS and Open Redirects", () => {
    expect(sanitizePlainText("  hello\u0000   world \n ", 50)).toBe("hello world");
    expect(sanitizeUrl("https://example.com/path")).toBe("https://example.com/path");
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeRedirectPath("/dashboard?tab=1")).toBe("/dashboard?tab=1");
    expect(sanitizeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\t/evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(sanitizeRedirectPath("/\\evil")).toBe("/dashboard");
  });

  it("performs constant-time secret comparison, signed VIP tokens, and email masking", () => {
    expect(safeTimingEqual("secret-token-1", "secret-token-1")).toBe(true);
    expect(safeTimingEqual("secret-token-1", "secret-token-2")).toBe(false);
    expect(matchesAllowedSecret("VIP_BETA", "VIP_ALPHA, VIP_BETA")).toBe(true);
    expect(matchesAllowedSecret("VIP_NOPE", "VIP_ALPHA, VIP_BETA")).toBe(false);
    expect(maskEmail("founder@domain.fr")).toBe("fo***@domain.fr");

    const signed = signVipToken("starter", "VIP_ALPHA");
    expect(verifyVipToken(signed, "VIP_ALPHA")).toBe(true);
    expect(verifyVipToken(signed, "WRONG_SECRET")).toBe(false);
    expect(verifyVipToken(`${signed}tamper`, "VIP_ALPHA")).toBe(false);
  });

  it("enforces same-origin validation strictly on state-changing requests", () => {
    const validReq = new Request("https://app.example.com/api/checkout", {
      method: "POST",
      headers: { origin: "https://app.example.com", "sec-fetch-site": "same-origin" },
    });
    const missingOriginReq = new Request("https://app.example.com/api/checkout", {
      method: "POST",
    });
    const crossSiteReq = new Request("https://app.example.com/api/checkout", {
      method: "POST",
      headers: { origin: "https://evil.com", "sec-fetch-site": "cross-site" },
    });

    expect(validateSameOrigin(validReq, "https://app.example.com")).toBe(true);
    expect(validateSameOrigin(missingOriginReq, "https://app.example.com")).toBe(false);
    expect(validateSameOrigin(crossSiteReq, "https://app.example.com")).toBe(false);
  });

  it("supports Result<T, E> railway helpers", () => {
    const success = ok({ count: 3 });
    const failure = err("FAILED");
    expect(isOk(success)).toBe(true);
    expect(isErr(failure)).toBe(true);
  });

  it("enforces Stripe amount floor, config invariants, and upload allow-list", () => {
    expect(computeStripeAmountCents(0)).toBe(50);
    expect(computeStripeAmountCents(1900)).toBe(1900);
    expect(siteConfig.plans.starter.priceCents).toBeGreaterThanOrEqual(100);
    expect(formatPrice(1900, "eur", "fr")).toContain("19");
    expect(isAllowedMimeType("image/jpeg")).toBe(true);
    expect(isAllowedMimeType("application/x-sh")).toBe(false);
    expect(uploadConfig.maxFileSizeBytes).toBe(10 * 1024 * 1024);
  });

  it("blocks dev/test/VIP traffic in PostHog firewall without false positives", () => {
    expect(isTestTraffic({ host: "localhost:3000" })).toBe(true);
    expect(isTestTraffic({ host: "demo.trycloudflare.com" })).toBe(true);
    expect(isTestTraffic({ email: "user+test@domain.com" })).toBe(true);
    expect(isTestTraffic({ email: "internal@team.io", excludedEmailsCsv: "internal@team.io" })).toBe(true);
    expect(isTestTraffic({ isVip: true })).toBe(true);
    expect(isTestTraffic({ livemode: false })).toBe(true);
    expect(
      isTestTraffic({
        host: "app.customer-domain.com",
        email: "contest@company.com",
        isVip: false,
        livemode: true,
      }),
    ).toBe(false);
  });

  it("degrades safely when optional env vars are missing and enforces rate limit", () => {
    const pub = getPublicEnv();
    expect(pub.NEXT_PUBLIC_APP_URL).toContain("http");
    const readiness = getEnvReadiness();
    expect(typeof readiness.supabase).toBe("boolean");

    const key = `test-rate-${Date.now()}`;
    expect(checkRateLimit(key, 2, 10_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 10_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 10_000).allowed).toBe(false);
  });
});
