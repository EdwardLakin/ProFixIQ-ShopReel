export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireShopId } from "@/features/shopreel/server/requireShopId";
import LibraryIndexClient from "@/features/shopreel/library/LibraryIndexClient";
import { buildShopReelLibraryItems } from "@/features/shopreel/library/libraryItem";

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

    return <section className="mx-auto w-full max-w-6xl px-4 py-10 text-white space-y-4">
      <div className="flex items-start justify-between gap-3"><div><h1 className="text-2xl font-semibold">Content Library</h1><p className="text-sm text-white/75">Track drafts, renders, exports, and manually posted content.</p></div><Link className="rounded border border-white/20 px-3 py-2" href="/shopreel/create">Create new draft</Link></div>
      {items.length === 0 ? <div className="rounded border border-white/15 p-4 text-sm">No ShopReel history yet. Start by creating a draft from <Link className="underline" href="/shopreel/create">/shopreel/create</Link>.</div> : <LibraryIndexClient items={items} resultLimit={QUERY_LIMIT} />}
    </section>;
  } catch (_error) {
    return <section className="mx-auto w-full max-w-5xl px-4 py-10 text-white"><h1 className="text-2xl font-semibold">Content Library</h1><div className="mt-4 rounded border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">Unable to load library history right now. Try again, or open <Link className="underline" href="/shopreel/render-jobs">Render Jobs</Link> and <Link className="underline" href="/shopreel/exports">Exports</Link>.</div></section>;
  }
}
