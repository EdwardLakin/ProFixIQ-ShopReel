export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import LibraryIndexClient from "@/features/shopreel/library/LibraryIndexClient";
import { buildShopReelLibraryItems } from "@/features/shopreel/library/libraryItem";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";

const QUERY_LIMIT = 120;

export default async function ShopReelLibraryPage() {
  try {
    const shopId = await requireShopId();
    const supabase = createAdminClient();

    const { data: generations, error: gErr } = await supabase
      .from("shopreel_story_generations")
      .select("id, content_piece_id, render_job_id, status, story_draft, generation_metadata, created_at, updated_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(QUERY_LIMIT);

    if (gErr) throw new Error(gErr.message);

    const generationIds = (generations ?? []).map((g) => g.id);
    const renderJobIds = (generations ?? []).flatMap((g) => (g.render_job_id ? [g.render_job_id] : []));
    const contentIds = (generations ?? []).flatMap((g) => (g.content_piece_id ? [g.content_piece_id] : []));

    const [{ data: contentPieces }, { data: renderJobs }, { data: exportPackages }] = await Promise.all([
      contentIds.length > 0
        ? supabase.from("content_pieces").select("id, title, hook, caption").eq("tenant_shop_id", shopId).in("id", contentIds)
        : Promise.resolve({ data: [] }),
      generationIds.length > 0
        ? supabase
             .from("reel_render_jobs")
            .select("id, status, content_piece_id, render_payload, render_url, thumbnail_url, error_message, attempt_count, created_at, updated_at")
            .eq("shop_id", shopId)
            .in("id", renderJobIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
      generationIds.length > 0
        ? supabase
            .from("shopreel_export_packages")
            .select("id, generation_id, render_job_id, content_piece_id, status, mp4_path, thumbnail_path, caption_text, hashtags, platform_outputs, exported_at, created_at, updated_at")
            .eq("shop_id", shopId)
            .in("generation_id", generationIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const items = buildShopReelLibraryItems({ generations: generations ?? [], contentPieces: contentPieces ?? [], renderJobs: renderJobs ?? [], exportPackages: exportPackages ?? [] });

    return (
      <GlassShell
        eyebrow="Library"
        title="Library"
        subtitle="Browse finished videos, captions, posts, blog drafts, and reusable campaign assets."
        actions={<Link href="/shopreel/create"><GlassButton variant="primary">Create content</GlassButton></Link>}
      >
        {items.length === 0 ? <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 text-sm text-white/80">No library assets yet. Videos, captions, blog drafts, thumbnails, and campaign assets will appear here after your first project is processed.</div> : <LibraryIndexClient items={items} resultLimit={QUERY_LIMIT} />}
      </GlassShell>
    );
  } catch (_error) {
    return <GlassShell eyebrow="Library" title="Library" subtitle="Browse finished videos, captions, posts, blog drafts, and reusable campaign assets."><div className="rounded border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">Unable to load library history right now. Try again, or open <Link className="underline" href="/shopreel/render-jobs">Processing</Link> and <Link className="underline" href="/shopreel/exports">Downloads</Link>.</div></GlassShell>;
  }
}
