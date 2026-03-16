import { getSubscription } from "./getSubscription";
import { ensureUsagePeriod } from "./ensureUsagePeriod";

export async function getUsageSnapshot(shopId: string) {
  const subscription = await getSubscription(shopId);
  const usagePeriod = await ensureUsagePeriod(shopId, subscription);

  return {
    subscription,
    usagePeriod,
    limit: subscription?.generation_limit ?? null,
    used: usagePeriod.generations_used,
    remaining:
      typeof subscription?.generation_limit === "number"
        ? Math.max(subscription.generation_limit - usagePeriod.generations_used, 0)
        : null,
  };
}
