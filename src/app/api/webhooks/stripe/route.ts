import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getServerEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/client";
import { handleStripeWebhookEvent } from "@/lib/stripe/webhook-handler";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getServerEnv();
  const stripe = getStripeClient();

  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const result = await handleStripeWebhookEvent(event, stripe);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      received: true,
      deduplicated: result.data.deduplicated,
      eventType: result.data.eventType,
    },
    { status: 200 },
  );
}
