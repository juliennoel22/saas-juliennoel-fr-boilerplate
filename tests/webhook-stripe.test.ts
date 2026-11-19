import Stripe from "stripe";
import { describe, expect, it } from "vitest";
import {
  processStripeWebhookWithStore,
  type WebhookIdempotencyStore,
} from "@/lib/stripe/webhook-handler";

describe("Stripe Webhook HMAC & Idempotency", () => {
  const testSecret = ["test", "signing", "secret", "0123456789abcdef"].join("_");
  const stripe = new Stripe(["test", "key", "0123456789"].join("_"), { typescript: true });

  it("verifies HMAC-SHA256 signatures and rejects tampered payloads", () => {
    const payload = JSON.stringify({
      id: "evt_unit_hmac_1",
      object: "event",
      type: "checkout.session.completed",
      livemode: false,
      created: 1_763_500_000,
      data: { object: { id: "cs_unit_1", object: "checkout.session" } },
    });

    const header = stripe.webhooks.generateTestHeaderString({
      payload,
      secret: testSecret,
    });

    const verified = stripe.webhooks.constructEvent(payload, header, testSecret);
    expect(verified.id).toBe("evt_unit_hmac_1");
    expect(verified.type).toBe("checkout.session.completed");

    expect(() =>
      stripe.webhooks.constructEvent(`${payload} `, header, testSecret),
    ).toThrow();
  });

  it("deduplicates repeated Stripe webhook deliveries and rolls back on failure", async () => {
    const seen = new Set<string>();
    const store: WebhookIdempotencyStore = {
      async recordEvent(event) {
        if (seen.has(event.id)) return "duplicate";
        seen.add(event.id);
        return "inserted";
      },
      async removeEvent(eventId) {
        seen.delete(eventId);
      },
    };

    const event = {
      id: "evt_unit_dedup_1",
      type: "checkout.session.completed",
    } as Stripe.Event;

    let sideEffectCount = 0;
    const first = await processStripeWebhookWithStore(event, store, async () => {
      sideEffectCount += 1;
    });
    const second = await processStripeWebhookWithStore(event, store, async () => {
      sideEffectCount += 1;
    });

    expect(first).toEqual({
      ok: true,
      data: { deduplicated: false, eventType: "checkout.session.completed" },
    });
    expect(second).toEqual({
      ok: true,
      data: { deduplicated: true, eventType: "checkout.session.completed" },
    });
    expect(sideEffectCount).toBe(1);

    const failingEvent = {
      id: "evt_unit_rollback_1",
      type: "checkout.session.completed",
    } as Stripe.Event;

    const failed = await processStripeWebhookWithStore(failingEvent, store, async () => {
      throw new Error("DB transient outage");
    });

    expect(failed.ok).toBe(false);
    expect(seen.has("evt_unit_rollback_1")).toBe(false);
  });
});
