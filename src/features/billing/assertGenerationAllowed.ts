import { getSubscription } from "./getSubscription";
import { ensureUsagePeriod } from "./ensureUsagePeriod";

export async function assertGenerationAllowed(shopId: string) {
  const subscription = await getSubscription(shopId);
  const usagePeriod = await ensureUsagePeriod(shopId, subscription);

  if (!subscription) {
    return {
      ok: true,
      subscription: null,
      usagePeriod,
      limit: null,
      used: usagePeriod.generations_used,
      remaining: null,
    };
  }

  if (
    subscription.status !== "active" &&
    subscription.status !== "trialing"
  ) {
    throw new Error("Billing subscription is not active");
  }

  const limit = subscription.generation_limit;
  const used = usagePeriod.generations_used;

  if (typeof limit === "number" && used >= limit) {
    throw new Error("Generation limit reached for current billing period");
  }

  return {
    ok: true,
    subscription,
    usagePeriod,
    limit,
    used,
    remaining: typeof limit === "number" ? Math.max(limit - used, 0) : null,
  };
}
