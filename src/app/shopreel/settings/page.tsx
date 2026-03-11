import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import ShopReelSettingsClient from "@/features/shopreel/ui/ShopReelSettingsClient";

export default function ShopReelSettingsPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Settings"
      subtitle="Connection, publishing, tone, and automation defaults — all through the shared glass control system."
    >
      <GlassNav />
      <ShopReelSettingsClient />
    </GlassShell>
  );
}
