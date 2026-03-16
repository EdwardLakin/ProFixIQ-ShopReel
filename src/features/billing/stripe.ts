import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripeServerClient() {
  if (cached) return cached;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  cached = new Stripe(apiKey);
  return cached;
}
