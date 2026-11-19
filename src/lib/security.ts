import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

export function sanitizePlainText(input: string, maxLength = 500): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(
  input: string,
  allowedProtocols: readonly string[] = ["https:", "http:"],
): string | null {
  try {
    const parsed = new URL(input.trim());
    if (!allowedProtocols.includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!path) return fallback;
  const trimmed = path.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.includes("\\") ||
    trimmed.includes("://") ||
    /[\u0000-\u001F\u007F]/.test(trimmed)
  ) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, "https://safe.local");
    if (parsed.origin !== "https://safe.local") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function safeTimingEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a, "utf8").digest();
  const hashB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(hashA, hashB);
}

export function matchesAllowedSecret(candidate: string, csvSecrets: string | undefined): boolean {
  if (!csvSecrets || !candidate.trim()) return false;
  const secrets = csvSecrets
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  let matched = false;
  for (const secret of secrets) {
    if (safeTimingEqual(candidate.trim(), secret)) {
      matched = true;
    }
  }
  return matched;
}

export function signVipToken(planKey: string, secretMaterial: string, ttlMs = 15 * 60_000): string {
  const exp = Date.now() + ttlMs;
  const payload = `${planKey}.${exp}`;
  const sig = createHmac("sha256", secretMaterial).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyVipToken(token: string | undefined, secretMaterial: string | undefined): boolean {
  if (!token || !secretMaterial) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [planKey, expRaw, sig] = parts;
  if (!planKey || !expRaw || !sig) return false;
  const exp = Number.parseInt(expRaw, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = createHmac("sha256", secretMaterial)
    .update(`${planKey}.${expRaw}`)
    .digest("base64url");
  return safeTimingEqual(sig, expected);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const prefix = local.length <= 2 ? local[0] ?? "*" : local.slice(0, 2);
  return `${prefix}***@${domain}`;
}

export function validateSameOrigin(req: Request, expectedAppUrl: string): boolean {
  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    return false;
  }

  const originHeader = req.headers.get("origin");
  const refererHeader = req.headers.get("referer");
  const sourceHeader = originHeader ?? refererHeader;
  if (!sourceHeader) {
    return false;
  }

  try {
    const sourceOrigin = new URL(sourceHeader).origin;
    const expectedOrigin = new URL(expectedAppUrl).origin;
    if (sourceOrigin === expectedOrigin) {
      return true;
    }
    if (process.env.NODE_ENV !== "production") {
      const host = new URL(sourceOrigin).hostname;
      return host === "localhost" || host === "127.0.0.1";
    }
    return false;
  } catch {
    return false;
  }
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

// TODO(security): Replace in-memory rate limit store with Upstash Redis / Postgres counter if deployed across multiple serverless regions.
export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    if (rateLimitStore.size > 2000) {
      for (const [k, bucket] of rateLimitStore.entries()) {
        if (bucket.resetAt <= now) rateLimitStore.delete(k);
      }
    }
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

export function getClientIp(req: Request): string {
  const platformIp =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip");
  if (platformIp) {
    const first = platformIp.split(",")[0]?.trim();
    if (first) return first;
  }

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const rightMost = hops[hops.length - 1];
    if (rightMost) return rightMost;
  }

  return "127.0.0.1";
}
