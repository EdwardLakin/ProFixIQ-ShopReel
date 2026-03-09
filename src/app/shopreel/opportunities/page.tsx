// src/app/shopreel/opportunities/page.tsx

import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassNav from "@/features/shopreel/ui/system/GlassNav";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";

export default function ShopReelOpportunitiesPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Opportunities"
      subtitle="Surface the best candidate content across manual uploads and shop-generated content in one queue."
      actions={<GlassButton variant="primary">Generate selected</GlassButton>}
    >
      <GlassNav />
      <ShopReelOpportunitiesClient />
    </GlassShell>
  );
}