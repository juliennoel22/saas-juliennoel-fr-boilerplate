"use client";

import posthog from "posthog-js";
import { isTestTraffic } from "@/lib/posthog/firewall";

export type PostHogEventName =
  | "landing_cta_clicked"
  | "aha_started"
  | "aha_step_completed"
  | "aha_completed"
  | "paywall_viewed"
  | "waiver_toggled"
  | "checkout_initiated"
  | "checkout_failed"
  | "vip_bypass_used"
  | "login_requested"
  | "oauth_initiated"
  | "portal_opened"
  | "sign_out";

export interface UtmParams {
  readonly source?: string;
  readonly medium?: string;
  readonly campaign?: string;
  readonly content?: string;
  readonly term?: string;
}

const UTM_STORAGE_KEY = "saas_utm_params_v1";

export function extractUtmFromSearch(search: string): UtmParams {
  const params = new URLSearchParams(search);
  const utm: Record<string, string> = {};
  const mapping = [
    ["utm_source", "source"],
    ["utm_medium", "medium"],
    ["utm_campaign", "campaign"],
    ["utm_content", "content"],
    ["utm_term", "term"],
  ] as const;

  for (const [queryKey, field] of mapping) {
    const val = params.get(queryKey)?.trim();
    if (val) utm[field] = val.slice(0, 100);
  }
  return utm as UtmParams;
}

export function persistUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const fromUrl = extractUtmFromSearch(window.location.search);
  const hasUrlUtm = Object.keys(fromUrl).length > 0;

  try {
    if (hasUrlUtm) {
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParams;
  } catch {
    return fromUrl;
  }
}

export function readPersistedUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const fromUrl = extractUtmFromSearch(window.location.search);
  try {
    const raw = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    const fromStorage = raw ? (JSON.parse(raw) as UtmParams) : {};
    return { ...fromStorage, ...fromUrl };
  } catch {
    return fromUrl;
  }
}

export function trackClientEvent(
  event: PostHogEventName,
  properties?: Record<string, string | number | boolean | undefined>,
): void {
  if (typeof window === "undefined") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

  const isVip = new URLSearchParams(window.location.search).get("mode") === "vip";
  if (isTestTraffic({ host: window.location.host, isVip })) {
    return;
  }

  const utm = readPersistedUtmParams();
  posthog.capture(event, {
    ...properties,
    ...(utm.source ? { utm_source: utm.source } : {}),
    ...(utm.medium ? { utm_medium: utm.medium } : {}),
    ...(utm.campaign ? { utm_campaign: utm.campaign } : {}),
    ...(utm.content ? { utm_content: utm.content } : {}),
  });
}
