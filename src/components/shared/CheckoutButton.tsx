"use client";

import { ArrowRightIcon } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { type PlanKey, siteConfig } from "@/config/site";
import { readPersistedUtmParams, trackClientEvent } from "@/lib/posthog/events";
import { cn } from "@/lib/utils";

const checkoutResponseSchema = z.object({
  type: z.enum(["stripe", "vip"]).optional(),
  url: z.url().optional(),
  redirectUrl: z.string().startsWith("/").optional(),
  error: z.string().optional(),
});

interface CheckoutButtonProps {
  readonly planKey: PlanKey;
  readonly label: string;
  readonly acceptedImmediateExecution: boolean;
  readonly vipCode?: string;
  readonly email?: string;
  readonly variant?: "default" | "outline";
  readonly className?: string;
}

export function CheckoutButton({
  planKey,
  label,
  acceptedImmediateExecution,
  vipCode,
  email,
  variant = "default",
  className,
}: CheckoutButtonProps): React.ReactElement {
  const [isLoading, setIsLoading] = useState(false);

  // Reset button state if user navigates back from Stripe Checkout via browser BFCache.
  useEffect(() => {
    const handlePageShow = (): void => {
      setIsLoading(false);
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleCheckout = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);

    const plan = siteConfig.plans[planKey];
    const utm = readPersistedUtmParams();

    trackClientEvent("checkout_initiated", {
      planKey,
      priceCents: plan.priceCents,
      mode: plan.mode,
    });

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey,
          email: email?.trim() || undefined,
          vipCode: vipCode?.trim() || undefined,
          acceptedImmediateExecution,
          utm: {
            source: utm.source,
            campaign: utm.campaign,
            content: utm.content,
          },
        }),
      });

      const rawJson: unknown = await response.json();
      const parsed = checkoutResponseSchema.safeParse(rawJson);
      const payload = parsed.success ? parsed.data : {};

      if (!response.ok) {
        trackClientEvent("checkout_failed", { planKey, status: response.status });
        toastManager.add({
          title: "Paiement interrompu",
          description: payload.error ?? "Impossible de démarrer le paiement.",
          type: "error",
        });
        setIsLoading(false);
        return;
      }

      if (payload.type === "vip") {
        trackClientEvent("vip_bypass_used", { planKey });
      }

      if (payload.url) {
        window.location.assign(payload.url);
        return;
      }

      if (payload.redirectUrl) {
        window.location.assign(payload.redirectUrl);
        return;
      }

      setIsLoading(false);
    } catch {
      trackClientEvent("checkout_failed", { planKey, status: 0 });
      toastManager.add({
        title: "Connexion interrompue",
        description: "Vérifiez votre réseau puis réessayez.",
        type: "error",
      });
      setIsLoading(false);
    }
  }, [acceptedImmediateExecution, email, isLoading, planKey, vipCode]);

  return (
    <Button
      className={cn("min-h-11 w-full justify-center", className)}
      loading={isLoading}
      onClick={handleCheckout}
      size="lg"
      variant={variant}
    >
      <span>{label}</span>
      <ArrowRightIcon aria-hidden="true" className="size-4" />
    </Button>
  );
}
