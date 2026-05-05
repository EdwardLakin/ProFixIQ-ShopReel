export const dynamic = "force-dynamic";

import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import PublishingHistoryClient, {
  type PublicationRow,
} from "@/features/shopreel/publishing/components/PublishingHistoryClient";
import { createAdminClient } from "@/lib/supabase/server";

export default async function ShopReelPublishedPage() {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("content_publications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Published"
      subtitle="Recent queued, published, and failed publication attempts."
    >
      <ShopReelNav />
      <PublishingHistoryClient initialPublications={(data ?? []) as PublicationRow[]} />
    </GlassShell>
  );
}
