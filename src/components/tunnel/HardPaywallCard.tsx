"use client";

import { CheckIcon, LockIcon } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { CheckoutButton } from "@/components/shared/CheckoutButton";
import { VipCodeInput } from "@/components/tunnel/VipCodeInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice, siteConfig, type TunnelVariant } from "@/config/site";
import { trackClientEvent } from "@/lib/posthog/events";

interface HardPaywallCardProps {
  readonly variant: TunnelVariant;
  readonly summaryTitle: string;
  readonly summaryText: string;
  readonly lockedHighlights?: readonly string[];
  readonly onBack: () => void;
}

export function HardPaywallCard({
  variant,
  summaryTitle,
  summaryText,
  lockedHighlights = [],
  onBack,
}: HardPaywallCardProps): React.ReactElement {
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const starterPlan = siteConfig.plans.starter;

  useEffect(() => {
    trackClientEvent("paywall_viewed", {
      variant,
      planKey: starterPlan.key,
      priceCents: starterPlan.priceCents,
    });
  }, [starterPlan.key, starterPlan.priceCents, variant]);

  const handleWaiverChange = (checked: boolean): void => {
    setAcceptedWaiver(checked);
    trackClientEvent("waiver_toggled", { variant, accepted: checked });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <LockIcon aria-hidden="true" className="size-3.5" />
          <span>Résultat prêt à débloquer</span>
        </div>
        <CardTitle>Aperçu prêt</CardTitle>
        <CardDescription>
          Débloquez le résultat complet et l&apos;export avec{" "}
          <span className="font-medium text-foreground">{starterPlan.name}</span> (
          {formatPrice(starterPlan.priceCents, starterPlan.currency, siteConfig.locale)}).
        </CardDescription>
      </CardHeader>

      <CardPanel className="space-y-4">
        <div className="rounded-xl border border-border bg-muted/50 p-4 text-sm">
          <p className="font-medium text-foreground">{summaryTitle}</p>
          <p className="mt-1 break-words text-muted-foreground">{summaryText}</p>
        </div>

        {lockedHighlights.length > 0 && (
          <ul className="space-y-2 rounded-xl border border-border p-4 text-xs">
            {lockedHighlights.map((item) => (
              <li className="flex items-start gap-2 text-foreground" key={item}>
                <CheckIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {siteConfig.legal.requiresImmediateExecutionWaiver && (
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-muted-foreground text-xs leading-relaxed">
            <input
              checked={acceptedWaiver}
              className="mt-0.5 size-4 shrink-0 accent-primary"
              onChange={(event) => handleWaiverChange(event.target.checked)}
              type="checkbox"
            />
            <span>
              Je confirme l&apos;exécution immédiate et renonce au droit de rétractation (Art.
              L221-28 13°).
            </span>
          </label>
        )}

        {siteConfig.features.vipBypassEnabled && (
          <VipCodeInput onChange={setVipCode} value={vipCode} />
        )}
      </CardPanel>

      <CardFooter className="flex-col gap-2">
        <CheckoutButton
          acceptedImmediateExecution={acceptedWaiver}
          label={`Débloquer (${formatPrice(starterPlan.priceCents, starterPlan.currency, siteConfig.locale)})`}
          planKey="starter"
          vipCode={vipCode}
        />
        <Button className="min-h-11 w-full" onClick={onBack} variant="ghost">
          Modifier la saisie
        </Button>
      </CardFooter>
    </Card>
  );
}
