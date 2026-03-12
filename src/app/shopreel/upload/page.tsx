import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import ManualUploadClient from "@/features/shopreel/manual/components/ManualUploadClient";

export default function ShopReelUploadPage() {
  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Upload Content"
      subtitle="Add manual photos and videos, then turn them into ShopReel AI concepts, videos, and render jobs."
    >
      <ShopReelNav />
      <ManualUploadClient />
    </GlassShell>
  );
}
