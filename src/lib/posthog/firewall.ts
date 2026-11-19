export interface TrafficContext {
  readonly host?: string | null;
  readonly email?: string | null;
  readonly isVip?: boolean;
  readonly livemode?: boolean;
  readonly excludedEmailsCsv?: string;
}

const TEST_HOST_PATTERNS = [
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  ".trycloudflare.com",
  ".ngrok",
  ".local",
];

const TEST_EMAIL_PATTERNS = [/^test[.+_-]?@/i, /\+test@/i, /@example\.com$/i, /@test\./i];

/**
 * Pure traffic firewall preventing internal dev/test/VIP traffic
 * from polluting PostHog production metrics or attribution.
 */
export function isTestTraffic(ctx: TrafficContext): boolean {
  if (ctx.isVip === true) {
    return true;
  }

  if (ctx.livemode === false) {
    return true;
  }

  if (ctx.host) {
    const normalizedHost = ctx.host.toLowerCase().trim();
    if (TEST_HOST_PATTERNS.some((pattern) => normalizedHost.includes(pattern))) {
      return true;
    }
  }

  if (ctx.email) {
    const normalizedEmail = ctx.email.toLowerCase().trim();
    if (TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(normalizedEmail))) {
      return true;
    }

    if (ctx.excludedEmailsCsv) {
      const customExclusions = ctx.excludedEmailsCsv
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item.length > 0);
      if (customExclusions.some((needle) => normalizedEmail.includes(needle))) {
        return true;
      }
    }
  }

  return false;
}
