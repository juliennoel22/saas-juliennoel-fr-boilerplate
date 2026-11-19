import { randomUUID } from "node:crypto";
import Stripe from "stripe";

async function main(): Promise<void> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const targetUrl = "http://127.0.0.1:3000/api/webhooks/stripe";

  if (!secretKey || !webhookSecret) {
    console.error("Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET in .env.local.");
    process.exit(1);
  }

  const stripe = new Stripe(secretKey, { typescript: true });
  const eventId = `evt_test_${randomUUID().replace(/-/g, "").slice(0, 20)}`;

  const payload = JSON.stringify({
    id: eventId,
    object: "event",
    api_version: "2025-02-24.acacia",
    created: Math.floor(Date.now() / 1000),
    livemode: false,
    type: "checkout.session.completed",
    data: {
      object: {
        id: `cs_test_${randomUUID().slice(0, 12)}`,
        object: "checkout.session",
        mode: "payment",
        amount_total: 1900,
        currency: "eur",
        customer_details: {
          email: "webhook-test@example.com",
        },
        metadata: {
          planKey: "starter",
          credits: "20",
        },
      },
    },
  });

  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: webhookSecret,
  });

  for (const attempt of [1, 2]) {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
      },
      body: payload,
    });

    const json = (await response.json()) as Record<string, unknown>;
    console.info(`Attempt ${attempt}:`, { status: response.status, body: json });

    if (response.status !== 200) {
      console.error(`Expected HTTP 200 on attempt ${attempt}, got ${response.status}.`);
      process.exit(1);
    }

    if (attempt === 2 && json.deduplicated !== true) {
      console.error("Expected deduplicated=true on second delivery.");
      process.exit(1);
    }
  }

  console.info("Webhook HMAC signature & idempotency verification passed.");
}

void main();
