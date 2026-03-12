import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";

export default function ShopReelOpportunitiesPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Story Sources"
      subtitle="Discover, save, and generate from the business events and uploads that power ShopReel."
      actions={<GlassButton variant="primary">Generate selected</GlassButton>}
    >
      <GlassNav />
      <ShopReelOpportunitiesClient />
    </GlassShell>
  );
}
