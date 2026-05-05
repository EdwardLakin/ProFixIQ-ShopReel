export const dynamic = "force-dynamic";

import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import { createAdminClient } from "@/lib/supabase/server";
import CreatorRequestsClient from "@/features/shopreel/creator/components/CreatorRequestsClient";

type Angle = {
  title: string;
  angle: string;
  hook: string;
  whyItWorks: string;
  suggestedCta: string;
};

type CreatorRequestRow = {
  id: string;
  title: string | null;
  topic: string | null;
  audience: string | null;
  tone: string | null;
  platform_focus: "instagram" | "tiktok" | "youtube" | "facebook" | "multi" | null;
  mode: string;
  status: string;
  created_at: string;
  source_generation_id: string | null;
  result_payload: {
    expandedTopic?: string;
    summary?: string;
    bullets?: string[];
    angles?: Angle[];
    derivedPosts?: Array<{
      title: string;
      generationId: string;
      createdAt: string;
      angleTitle: string;
    }>;
  } | null;
};

export default async function ShopReelCreatorRequestsPage() {
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data, error } = await legacy
    .from("shopreel_creator_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="AI Requests"
      subtitle="Saved creator prompts, research runs, angle packs, debunks, and stitch requests."
    >
      <ShopReelNav />
      <CreatorRequestsClient initialItems={(data ?? []) as CreatorRequestRow[]} />
    </GlassShell>
  );
}
