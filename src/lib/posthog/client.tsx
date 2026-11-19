"use client";

import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import type React from "react";
import { useEffect, useRef } from "react";
import { persistUtmParams } from "@/lib/posthog/events";
import { isTestTraffic } from "@/lib/posthog/firewall";
import type { PostHogBootstrapData } from "@/lib/posthog/server";

interface PHProviderProps {
  readonly bootstrap?: PostHogBootstrapData;
  readonly children: React.ReactNode;
}

export function PHProvider({ bootstrap, children }: PHProviderProps): React.ReactElement {
  const initializedRef = useRef(false);

  useEffect(() => {
    persistUtmParams();

    const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!apiKey || initializedRef.current) return;

    const isVip = new URLSearchParams(window.location.search).get("mode") === "vip";
    if (isTestTraffic({ host: window.location.host, isVip })) {
      return;
    }

    const rawHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
    const uiHost = rawHost.includes("eu.") ? "https://eu.posthog.com" : "https://us.posthog.com";

    posthog.init(apiKey, {
      api_host: "/ingest",
      ui_host: uiHost,
      capture_pageview: true,
      capture_pageleave: true,
      person_profiles: "identified_only",
      bootstrap: bootstrap
        ? {
            distinctID: bootstrap.distinctId,
            featureFlags: bootstrap.featureFlags,
          }
        : undefined,
    });

    initializedRef.current = true;
  }, [bootstrap]);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
