import { PostHog } from "posthog-node";
import { getServerEnv } from "@/lib/env";
import { isTestTraffic, type TrafficContext } from "@/lib/posthog/firewall";

export interface PostHogBootstrapData {
  readonly distinctId: string;
  readonly featureFlags: Record<string, string | boolean>;
}

function createServerPostHog(): PostHog | null {
  const env = getServerEnv();
  if (!env.NEXT_PUBLIC_POSTHOG_KEY) {
    return null;
  }

  return new PostHog(env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });
}

export async function getPostHogBootstrap(
  distinctId: string,
  traffic?: TrafficContext,
): Promise<PostHogBootstrapData> {
  const fallback: PostHogBootstrapData = { distinctId, featureFlags: {} };
  if (traffic && isTestTraffic(traffic)) {
    return fallback;
  }

  const client = createServerPostHog();
  if (!client) {
    return fallback;
  }

  try {
    const timeoutPromise = new Promise<Record<string, string | boolean>>((resolve) => {
      setTimeout(() => resolve({}), 750);
    });

    const flagsPromise = client
      .getAllFlags(distinctId)
      .then((flags) => flags as Record<string, string | boolean>)
      .catch(() => ({}));

    const featureFlags = await Promise.race([flagsPromise, timeoutPromise]);
    return { distinctId, featureFlags };
  } catch {
    return fallback;
  } finally {
    await client.shutdown().catch(() => undefined);
  }
}

export async function trackServerEvent(params: {
  distinctId: string;
  event: string;
  properties?: Record<string, string | number | boolean | null | undefined>;
  traffic?: TrafficContext;
}): Promise<void> {
  if (params.traffic && isTestTraffic(params.traffic)) {
    return;
  }

  const client = createServerPostHog();
  if (!client) {
    return;
  }

  try {
    client.capture({
      distinctId: params.distinctId,
      event: params.event,
      properties: params.properties,
    });
  } finally {
    await client.shutdown().catch(() => undefined);
  }
}
