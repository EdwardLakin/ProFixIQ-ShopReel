export const dynamic = "force-dynamic";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import HomeCommandClient from "./HomeCommandClient";
import { getShopScopeColumnForTable } from "@/features/shopreel/server/shopScope";
import {
  getOperatorWorldHref,
  getOperatorWorldPriority,
  normalizeOperatorWorldStatus,
  sortOperatorWorlds,
  type OperatorWorldCard,
} from "@/features/shopreel/operator/operatorWorlds";

type StoryDraft = { title?: unknown };
type StorySource = { title?: unknown };

export default async function ShopReelPage() {
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const resolveOptionalRuntimeRows = async (table: "content_pieces" | "content_publications", selectColumns: string) => {
    const scopeColumn = getShopScopeColumnForTable(table);
    const primary = await supabase.from(table).select(selectColumns).eq(scopeColumn, shopId).order("updated_at", { ascending: false }).limit(3);
    if (!primary.error) return primary;

    console.warn("[shopreel] runtime context query warning", { table, phase: "primary", message: primary.error.message });
    const fallback = await supabase
      .from(table)
      .select(selectColumns.replace(",updated_at", ""))
      .or(`tenant_shop_id.eq.${shopId},source_shop_id.eq.${shopId}`)
      .order("created_at", { ascending: false })
      .limit(3);
    if (fallback.error) {
      console.warn("[shopreel] runtime context query warning", { table, phase: "fallback", message: fallback.error.message });
    }
    return fallback;
  };

  const sources = await Promise.allSettled([
    supabase.from("shopreel_story_generations").select("id,status,created_at,updated_at,story_draft").eq("shop_id", shopId).order("created_at", { ascending: false }).limit(4),
    supabase.from("shopreel_campaigns").select("id,title,status,created_at,updated_at").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(3),
    resolveOptionalRuntimeRows("content_pieces", "id,title,status,created_at,updated_at"),
    supabase.from("reel_render_jobs").select("id,status,created_at,updated_at").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(3),
    resolveOptionalRuntimeRows("content_publications", "id,status,created_at,updated_at"),
    supabase.from("shopreel_content_opportunities").select("id,status,created_at,updated_at,story_source:shopreel_story_sources(title)").eq("shop_id", shopId).order("updated_at", { ascending: false }).limit(3),
  ]);

  const worlds: OperatorWorldCard[] = [];
  const loadErrors = sources.flatMap((source, index) => {
    if (source.status !== "fulfilled" || !source.value.error) return [] as string[];
    const surface = ["story_generations", "campaigns", "content_pieces", "render_jobs", "content_publications", "opportunities"][index];
    return [`${surface}: ${source.value.error.message}`];
  });


  const [generations, campaigns, contentPieces, renderJobs, publications, opportunities] = sources;

  if (generations.status === "fulfilled" && !generations.value.error) {
    for (const row of generations.value.data ?? []) {
      const title = typeof (row.story_draft as StoryDraft | null)?.title === "string" ? String((row.story_draft as StoryDraft).title) : "Untitled generation";
      const normalizedStatus = normalizeOperatorWorldStatus("generation", row.status);
      worlds.push({
        id: row.id,
        kind: "generation",
        title,
        status: row.status ?? "unknown",
        normalizedStatus,
        sourceLabel: "Story Generation",
        stageLabel: normalizedStatus.replaceAll("_", " "),
        actionLabel: "Open generation",
        priority: getOperatorWorldPriority("generation", normalizedStatus, row.updated_at),
        updatedAt: row.updated_at,
        createdAt: row.created_at,
        href: getOperatorWorldHref("generation", row.id),
      });
    }
  }

  if (campaigns.status === "fulfilled" && !campaigns.value.error) {
    for (const row of campaigns.value.data ?? []) {
      const normalizedStatus = normalizeOperatorWorldStatus("campaign", row.status);
      worlds.push({ id: row.id, kind: "campaign", title: row.title ?? "Untitled campaign", status: row.status ?? "unknown", normalizedStatus, sourceLabel: "Campaign", stageLabel: normalizedStatus.replaceAll("_", " "), actionLabel: "Open campaign", priority: getOperatorWorldPriority("campaign", normalizedStatus, row.updated_at), updatedAt: row.updated_at, createdAt: row.created_at, href: getOperatorWorldHref("campaign", row.id) });
    }
  }

  if (contentPieces.status === "fulfilled" && !contentPieces.value.error) {
    for (const row of ((contentPieces.value.data ?? []) as unknown as Array<{ id: string; title: string | null; status: string | null; created_at: string; updated_at?: string | null }>)) {
      const normalizedStatus = normalizeOperatorWorldStatus("content_piece", row.status);
      const updatedAt = row.updated_at ?? row.created_at;
      worlds.push({ id: row.id, kind: "content_piece", title: row.title ?? "Untitled content", status: row.status ?? "unknown", normalizedStatus, sourceLabel: "Content Piece", stageLabel: normalizedStatus.replaceAll("_", " "), actionLabel: "Open content", priority: getOperatorWorldPriority("content_piece", normalizedStatus, updatedAt), updatedAt, createdAt: row.created_at, href: getOperatorWorldHref("content_piece", row.id) });
    }
  }

  if (renderJobs.status === "fulfilled" && !renderJobs.value.error) {
    for (const row of renderJobs.value.data ?? []) {
      const normalizedStatus = normalizeOperatorWorldStatus("render_job", row.status);
      worlds.push({ id: row.id, kind: "render_job", title: `Render job ${row.id.slice(0, 8)}`, status: row.status ?? "unknown", normalizedStatus, sourceLabel: "Render Job", stageLabel: normalizedStatus.replaceAll("_", " "), actionLabel: "Open render job", priority: getOperatorWorldPriority("render_job", normalizedStatus, row.updated_at), updatedAt: row.updated_at, createdAt: row.created_at, href: getOperatorWorldHref("render_job", row.id) });
    }
  }

  if (publications.status === "fulfilled" && !publications.value.error) {
    for (const row of ((publications.value.data ?? []) as unknown as Array<{ id: string; status: string | null; created_at: string; updated_at?: string | null }>)) {
      const normalizedStatus = normalizeOperatorWorldStatus("publication", row.status);
      const updatedAt = row.updated_at ?? row.created_at;
      worlds.push({ id: row.id, kind: "publication", title: `Publication ${row.id.slice(0, 8)}`, status: row.status ?? "unknown", normalizedStatus, sourceLabel: "Publication", stageLabel: normalizedStatus.replaceAll("_", " "), actionLabel: "Open publish center", priority: getOperatorWorldPriority("publication", normalizedStatus, updatedAt), updatedAt, createdAt: row.created_at, href: getOperatorWorldHref("publication", row.id) });
    }
  }

  if (opportunities.status === "fulfilled" && !opportunities.value.error) {
    for (const row of opportunities.value.data ?? []) {
      const source = Array.isArray(row.story_source) ? (row.story_source[0] as StorySource | null) : (row.story_source as StorySource | null);
      const normalizedStatus = normalizeOperatorWorldStatus("opportunity", row.status);
      worlds.push({ id: row.id, kind: "opportunity", title: typeof source?.title === "string" ? source.title : `Opportunity ${row.id.slice(0, 8)}`, status: row.status ?? "unknown", normalizedStatus, sourceLabel: "Opportunity", stageLabel: normalizedStatus.replaceAll("_", " "), actionLabel: "Open idea", priority: getOperatorWorldPriority("opportunity", normalizedStatus, row.updated_at), updatedAt: row.updated_at, createdAt: row.created_at, href: getOperatorWorldHref("opportunity", row.id) });
    }
  }

  const recent = sortOperatorWorlds(worlds).slice(0, 12);

  return <GlassShell title="ShopReel Command Center" hidePageIntro hideNotificationsBell fullBleed className="space-y-0"><HomeCommandClient recent={recent} loadErrors={loadErrors} /></GlassShell>;
}
