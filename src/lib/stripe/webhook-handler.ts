import type Stripe from "stripe";
import { type PlanKey, siteConfig } from "@/config/site";
import { sendTransactionalEmail } from "@/lib/email/resend";
import { getServerEnv } from "@/lib/env";
import { trackServerEvent } from "@/lib/posthog/server";
import { isValidUUID } from "@/lib/security";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database.types";
import { err, ok, type Result } from "@/types/result";

export interface WebhookProcessResult {
  readonly deduplicated: boolean;
  readonly eventType: string;
}

export interface WebhookIdempotencyStore {
  recordEvent: (event: Stripe.Event) => Promise<"inserted" | "duplicate" | "error">;
  removeEvent: (eventId: string) => Promise<void>;
}

interface LegacyChargeBag {
  readonly charges?: {
    readonly data?: ReadonlyArray<{
      readonly billing_details?: { readonly email?: string | null };
    }>;
  };
}

export async function extractCustomerEmailFromSession(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<string | null> {
  if (session.customer_details?.email) return session.customer_details.email.toLowerCase();
  if (session.customer_email) return session.customer_email.toLowerCase();

  if (session.payment_intent) {
    const piId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;
    try {
      const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
      if (pi.latest_charge && typeof pi.latest_charge !== "string") {
        const latestEmail = pi.latest_charge.billing_details?.email;
        if (latestEmail) return latestEmail.toLowerCase();
      }
      const legacy = pi as unknown as LegacyChargeBag;
      const legacyEmail = legacy.charges?.data?.[0]?.billing_details?.email;
      if (legacyEmail) return legacyEmail.toLowerCase();
    } catch {
      // Fall through to customer lookup
    }
  }

  if (session.customer) {
    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer.id;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      if (!customer.deleted && customer.email) return customer.email.toLowerCase();
    } catch {
      return null;
    }
  }
  return null;
}

async function resolveOrCreateUserId(email: string, existingUserId?: string): Promise<string> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin unavailable");

  if (existingUserId && isValidUUID(existingUserId)) return existingUserId;

  const { data: existingProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingProfile?.id) return existingProfile.id;

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
  });
  if (!error && created.user) return created.user.id;

  const { data: retryProfile } = await admin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (!retryProfile?.id) throw new Error("Unable to provision user account for Stripe customer");
  return retryProfile.id;
}

async function provisionCheckoutCompleted(
  event: Stripe.Event,
  session: Stripe.Checkout.Session,
  stripe: Stripe,
): Promise<void> {
  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin unavailable");

  const email = await extractCustomerEmailFromSession(session, stripe);
  if (!email) throw new Error("Unable to extract customer email from Stripe session");

  const metaPlan = session.metadata?.planKey;
  const planKey: PlanKey = metaPlan === "pro" ? "pro" : "starter";
  const plan = siteConfig.plans[planKey];
  const parsedCredits = Number.parseInt(session.metadata?.credits ?? "", 10);
  const creditsToGrant =
    Number.isFinite(parsedCredits) && parsedCredits > 0 ? parsedCredits : plan.credits;
  const userId = await resolveOrCreateUserId(
    email,
    session.metadata?.userId ?? session.client_reference_id ?? undefined,
  );

  const stripeCustomerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
  const stripeSubscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id ?? null;

  const profilePatch: Database["public"]["Tables"]["profiles"]["Update"] = {
    plan: planKey,
    is_active: true,
    ...(stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : {}),
    ...(stripeSubscriptionId ? { stripe_subscription_id: stripeSubscriptionId } : {}),
    ...(session.metadata?.utm_source ? { utm_source: session.metadata.utm_source } : {}),
    ...(session.metadata?.utm_campaign ? { utm_campaign: session.metadata.utm_campaign } : {}),
    ...(session.metadata?.utm_content ? { utm_content: session.metadata.utm_content } : {}),
  };

  const { error: updateError } = await admin.from("profiles").update(profilePatch).eq("id", userId);
  if (updateError) throw new Error(`Profile update failed: ${updateError.code ?? "db_error"}`);

  if (creditsToGrant > 0) {
    const { error: creditError } = await admin.rpc("credit_user_credits", {
      p_user_id: userId,
      p_amount: creditsToGrant,
      p_reason: `stripe_checkout:${planKey}`,
      p_reference_id: event.id,
    });
    if (creditError) throw new Error(`Credit grant failed: ${creditError.code ?? "rpc_error"}`);
  }

  const env = getServerEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  await sendTransactionalEmail({
    to: email,
    subject: `${siteConfig.name} — Votre accès est activé`,
    html: `<p>Votre paiement a été confirmé (${plan.name}). Accédez à votre espace : <a href="${appUrl}/login">${appUrl}/login</a>.</p>`,
  });

  if (event.livemode) {
    await trackServerEvent({
      distinctId: userId,
      event: "purchase_completed",
      properties: {
        planKey,
        amountCents: session.amount_total ?? plan.priceCents,
        currency: session.currency ?? plan.currency,
      },
      traffic: { email, livemode: event.livemode, excludedEmailsCsv: env.POSTHOG_EXCLUDED_EMAILS },
    });
  }
}

function createSupabaseIdempotencyStore(): WebhookIdempotencyStore | null {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  return {
    async recordEvent(event: Stripe.Event) {
      const { error } = await admin.from("webhook_events").insert({
        id: event.id,
        provider: "stripe",
        event_type: event.type,
        payload: { livemode: event.livemode, created: event.created } as Json,
      });
      if (!error) return "inserted";
      return error.code === "23505" ? "duplicate" : "error";
    },
    async removeEvent(eventId: string) {
      await admin.from("webhook_events").delete().eq("id", eventId);
    },
  };
}

export async function processStripeWebhookWithStore(
  event: Stripe.Event,
  store: WebhookIdempotencyStore,
  onProcess: (ev: Stripe.Event) => Promise<void>,
): Promise<Result<WebhookProcessResult, string>> {
  const status = await store.recordEvent(event);
  if (status === "duplicate") return ok({ deduplicated: true, eventType: event.type });
  if (status === "error") return err("Unable to persist webhook idempotency record.");

  try {
    await onProcess(event);
    return ok({ deduplicated: false, eventType: event.type });
  } catch {
    await store.removeEvent(event.id).catch(() => undefined);
    return err("Webhook processing failed; rolled back idempotency lock for retry.");
  }
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event,
  stripe: Stripe,
): Promise<Result<WebhookProcessResult, string>> {
  const store = createSupabaseIdempotencyStore();
  const admin = getSupabaseAdmin();
  if (!store || !admin) return err("Supabase admin client is not configured.");

  return processStripeWebhookWithStore(event, store, async (ev) => {
    switch (ev.type) {
      case "checkout.session.completed": {
        await provisionCheckoutCompleted(ev, ev.data.object as Stripe.Checkout.Session, stripe);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = ev.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) {
          const { error } = await admin
            .from("profiles")
            .update({ is_active: true })
            .eq("stripe_customer_id", customerId);
          if (error) throw new Error("Failed to reactivate profile on invoice payment");
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = ev.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (customerId) {
          const { error } = await admin
            .from("profiles")
            .update({ is_active: false, plan: "free", stripe_subscription_id: null })
            .eq("stripe_customer_id", customerId);
          if (error) throw new Error("Failed to deactivate cancelled subscription");
        }
        break;
      }
      default:
        break;
    }
  });
}
