import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelOpportunitiesClient from "@/features/shopreel/components/ShopReelOpportunitiesClient";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { getOpportunityStatusesForTab } from "@/features/shopreel/opportunities/lib/status";
import { ShopReelPageHero, ShopReelSurface } from "@/features/shopreel/ui/system/ShopReelPagePrimitives";

const STARTERS=["Product launch","Founder story","Behind the scenes","How-to tutorial","Newsletter sequence","Repurpose a video"];

export default async function ShopReelOpportunitiesPage(props: { searchParams?: Promise<{ status?: string }>; }) {
  const searchParams = (await props.searchParams) ?? {};
  const status = searchParams.status ?? "active";
  const supabase = createAdminClient();
  const shopId = await getCurrentShopId();
  const allowedStatuses = getOpportunityStatusesForTab(status);
  const { data: opportunities, error } = await supabase.from("shopreel_content_opportunities").select(`*,story_source:shopreel_story_sources (id,title,description,kind,origin)`).eq("shop_id", shopId).in("status", allowedStatuses).order("score", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const normalized = (opportunities ?? []).map((row) => ({...row,story_source: Array.isArray(row.story_source) ? row.story_source[0] ?? null : row.story_source,}));
  return <GlassShell title="Ideas" hidePageIntro><div className="space-y-4"><ShopReelPageHero title="Ideas" subtitle="Capture prompts, campaign angles, and content opportunities." actions={[{label:"Create from idea",href:"/shopreel/create",primary:true},{label:"Discover ideas",href:"/shopreel/opportunities?status=active"}]}/><ShopReelSurface title="Prompt starters"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{STARTERS.map((s)=><div key={s} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/80">{s}</div>)}</div></ShopReelSurface><ShopReelSurface title="Idea board"><ShopReelOpportunitiesClient opportunities={normalized} activeTab={status} /></ShopReelSurface></div></GlassShell>;
}
