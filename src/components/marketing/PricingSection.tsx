"use client";

import { CheckIcon } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { CheckoutButton } from "@/components/shared/CheckoutButton";
import { VipCodeInput } from "@/components/tunnel/VipCodeInput";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardPanel,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice, type PlanKey, siteConfig } from "@/config/site";

export function PricingSection(): React.ReactElement {
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  const [vipCode, setVipCode] = useState("");
  const plans = Object.values(siteConfig.plans);

  return (
    <section className="border-t border-border bg-background py-14 sm:py-20" id="pricing">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl sm:text-center">
          <h2 className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            Tarification simple et transparente
          </h2>
          <p className="mt-2 text-muted-foreground text-sm sm:text-base">
            Paiement sécurisé via Stripe Hosted Checkout. Accès immédiat dès confirmation.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={plan.highlighted ? "border-foreground" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlighted && <Badge variant="default">Recommandé</Badge>}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardPanel className="space-y-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-semibold text-3xl text-foreground">
                    {formatPrice(plan.priceCents, plan.currency, siteConfig.locale)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {plan.mode === "subscription"
                      ? `/${plan.interval === "year" ? "an" : "mois"}`
                      : "paiement unique"}
                  </span>
                </div>

                <ul className="space-y-2.5 text-sm">
                  {plan.features.map((feature) => (
                    <li className="flex items-start gap-2.5" key={feature}>
                      <CheckIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardPanel>

              <CardFooter>
                <CheckoutButton
                  acceptedImmediateExecution={acceptedWaiver}
                  label={`Choisir ${plan.name}`}
                  planKey={plan.key as PlanKey}
                  variant={plan.highlighted ? "default" : "outline"}
                  vipCode={vipCode}
                />
              </CardFooter>
            </Card>
          ))}
        </div>

        {siteConfig.legal.requiresImmediateExecutionWaiver && (
          <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-muted-foreground text-xs leading-relaxed">
            <input
              checked={acceptedWaiver}
              className="mt-0.5 size-4 shrink-0 accent-primary"
              onChange={(event) => setAcceptedWaiver(event.target.checked)}
              type="checkbox"
            />
            <span>
              Je demande l&apos;exécution immédiate du service numérique dès la validation du
              paiement et reconnais renoncer à mon droit de rétractation conformément à
              l&apos;article L221-28 13° du Code de la consommation.
            </span>
          </label>
        )}

        {siteConfig.features.vipBypassEnabled && (
          <div className="mt-4">
            <VipCodeInput onChange={setVipCode} value={vipCode} />
          </div>
        )}
      </div>
    </section>
  );
}
