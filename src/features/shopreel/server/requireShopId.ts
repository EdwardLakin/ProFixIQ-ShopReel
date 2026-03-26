import { getCurrentShopId } from "./getCurrentShopId";

export async function requireShopId(explicitShopId?: string) {
  if (typeof explicitShopId === "string" && explicitShopId.trim().length > 0) {
    return explicitShopId.trim();
  }

  const shopId = await getCurrentShopId();

  if (!shopId || shopId.trim().length === 0) {
    throw new Error("[requireShopId] Could not resolve shopId");
  }

  return shopId;
}
