import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";

export default function ShopReelOpportunitiesPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Opportunities"
      subtitle="Discover, score, generate, and move strong story candidates into editing and publishing."
      actions={
        <>
          <Link href="/shopreel/generations">
            <GlassButton variant="ghost">View generations</GlassButton>
          </Link>
          <GlassButton variant="primary">Generate selected</GlassButton>
        </>
      }
    >
      <ShopReelNav />
      <ShopReelOpportunitiesClient />
    </GlassShell>
  );
}
