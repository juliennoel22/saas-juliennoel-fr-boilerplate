import Stripe from "stripe";
import { getServerEnv } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe | null {
  const env = getServerEnv();
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
      typescript: true,
    });
  }

  return stripeInstance;
}
