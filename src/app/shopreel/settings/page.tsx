import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelSettingsClient from "@/features/shopreel/ui/ShopReelSettingsClient";
import { getShopReelSettings } from "@/features/shopreel/settings/getShopReelSettings";

const DEFAULT_SHOP_ID = "e4d23a6d-9418-49a5-8a1b-6a2640615b5b";

export default async function ShopReelSettingsPage() {
  const result = await getShopReelSettings(DEFAULT_SHOP_ID);

  return (
    <ShopReelShell
      title="Settings"
      subtitle="Configure shop-level platform connections, publishing behavior, and brand defaults before launch."
    >
      <ShopReelSettingsClient
        shopId={DEFAULT_SHOP_ID}
        initial={{
          settings: result.settings,
          platforms: result.platforms,
          readiness: result.readiness,
        }}
      />
    </ShopReelShell>
  );
}
