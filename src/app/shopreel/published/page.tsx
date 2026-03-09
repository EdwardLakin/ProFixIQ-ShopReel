import ShopReelShell from "@/features/shopreel/ui/ShopReelShell";
import ShopReelCard from "@/features/shopreel/ui/ShopReelCard";
import ShopReelEmpty from "@/features/shopreel/ui/ShopReelEmpty";

export default function ShopReelPublishedPage() {
  return (
    <ShopReelShell
      title="Published"
      subtitle="Published reels and platform delivery status will live here next."
    >
      <ShopReelCard title="Published Feed" eyebrow="Coming Next">
        <ShopReelEmpty message="Published videos, platform links, and delivery tracking will appear here." />
      </ShopReelCard>
    </ShopReelShell>
  );
}
