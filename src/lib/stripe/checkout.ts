import type Stripe from "stripe";
import { z } from "zod";
import { type PlanKey, type PricingPlan, siteConfig } from "@/config/site";
import { getServerEnv } from "@/lib/env";
import { matchesAllowedSecret, sanitizePlainText } from "@/lib/security";
import { getStripeClient } from "@/lib/stripe/client";
import { err, ok, type Result } from "@/types/result";

export const checkoutRequestSchema = z.object({
  planKey: z.enum(["starter", "pro"]),
  email: z.string().trim().max(254).pipe(z.email()).optional(),
  vipCode: z.string().trim().max(64).optional(),
  acceptedImmediateExecution: z.boolean().optional(),
  utm: z
    .object({
      source: z.string().max(100).optional(),
      campaign: z.string().max(100).optional(),
      content: z.string().max(100).optional(),
    })
    .optional(),
});

export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;

export type CheckoutSessionResult =
  | { readonly type: "stripe"; readonly url: string; readonly sessionId: string }
  | { readonly type: "vip"; readonly planKey: PlanKey; readonly redirectUrl: string };

export function computeStripeAmountCents(priceCents: number): number {
  return Math.max(50, Math.round(priceCents));
}

export function buildLineItemForPlan(
  plan: PricingPlan,
  envPriceId: string | undefined,
): Stripe.Checkout.SessionCreateParams.LineItem {
  if (envPriceId) {
    return { price: envPriceId, quantity: 1 };
  }

  const unitAmount = computeStripeAmountCents(plan.priceCents);
  return {
    quantity: 1,
    price_data: {
      currency: plan.currency,
      unit_amount: unitAmount,
      product_data: {
        name: `${siteConfig.name} — ${plan.name}`,
        description: plan.description,
      },
      ...(plan.mode === "subscription"
        ? { recurring: { interval: plan.interval ?? "month" } }
        : {}),
    },
  };
}

export async function createHostedCheckoutSession(
  input: CheckoutRequestInput,
  authenticatedUser?: { id: string; email?: string | null },
): Promise<Result<CheckoutSessionResult, string>> {
  const env = getServerEnv();
  const plan = siteConfig.plans[input.planKey as PlanKey];

  if (
    siteConfig.features.vipBypassEnabled &&
    input.vipCode &&
    matchesAllowedSecret(input.vipCode, env.VIP_BYPASS_CODES)
  ) {
    // VIP bypass never creates a Stripe charge and never emits live Purchase analytics.
    return ok({
      type: "vip",
      planKey: plan.key,
      redirectUrl: `/access?mode=vip&plan=${encodeURIComponent(plan.key)}`,
    });
  }

  if (
    siteConfig.legal.requiresImmediateExecutionWaiver &&
    input.acceptedImmediateExecution !== true
  ) {
    return err("Veuillez confirmer l'exécution immédiate avant de poursuivre vers le paiement.");
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return err("Le module de paiement Stripe n'est pas encore configuré.");
  }

  const envPriceId = env[plan.stripePriceEnvKey];
  const baseUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const customerEmail = authenticatedUser?.email ?? input.email;

  const metadata: Record<string, string> = {
    planKey: plan.key,
    credits: String(plan.credits),
    ...(authenticatedUser?.id ? { userId: authenticatedUser.id } : {}),
    ...(input.utm?.source ? { utm_source: sanitizePlainText(input.utm.source, 100) } : {}),
    ...(input.utm?.campaign ? { utm_campaign: sanitizePlainText(input.utm.campaign, 100) } : {}),
    ...(input.utm?.content ? { utm_content: sanitizePlainText(input.utm.content, 100) } : {}),
  };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: plan.mode,
      ...(plan.mode === "payment" ? { customer_creation: "always" as const } : {}),
      line_items: [buildLineItemForPlan(plan, envPriceId)],
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      customer_email: customerEmail ?? undefined,
      client_reference_id: authenticatedUser?.id,
      allow_promotion_codes: true,
      metadata,
    });

    if (!session.url) {
      return err("Impossible de générer l'URL de paiement Stripe.");
    }

    return ok({
      type: "stripe",
      url: session.url,
      sessionId: session.id,
    });
  } catch {
    return err("Erreur lors de la création de la session de paiement.");
  }
}
