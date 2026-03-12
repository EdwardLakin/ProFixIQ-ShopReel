import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import ShopReelSettingsClient from "@/features/shopreel/ui/ShopReelSettingsClient";

export default function ShopReelSettingsPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Settings"
      subtitle="Connection, publishing, tone, and automation defaults — all through the shared glass control system."
    >
      <ShopReelNav />
      <ShopReelSettingsClient />
    </GlassShell>
  );
}
