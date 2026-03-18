import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function normalizeMediaJob<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export default async function ShopReelCampaignItemDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();

  const { data: itemRaw, error } = await supabase
    .from("shopreel_campaign_items")
    .select(`
      *,
      campaign:shopreel_campaigns (*),
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        provider,
        preview_url,
        output_asset_id,
        source_content_piece_id,
        source_generation_id,
        error_text,
        created_at,
        updated_at
      )
    `)
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!itemRaw) {
    return (
      <GlassShell eyebrow="ShopReel" title="Campaign item not found" subtitle="No campaign item found for this workspace.">
        <ShopReelNav />
        <GlassCard strong>
          <div className={cx("text-sm", glassTheme.text.secondary)}>No campaign item found.</div>
        </GlassCard>
      </GlassShell>
    );
  }

  const mediaJob = normalizeMediaJob(itemRaw.media_job);
  const campaign = normalizeMediaJob(itemRaw.campaign as any);

  const { data: scenes, error: scenesError } = await supabase
    .from("shopreel_campaign_item_scenes")
    .select(`
      *,
      media_job:shopreel_media_generation_jobs (
        id,
        status,
        provider,
        preview_url,
        output_asset_id,
        source_content_piece_id,
        source_generation_id,
        error_text,
        created_at,
        updated_at
      )
    `)
    .eq("campaign_item_id", itemRaw.id)
    .eq("shop_id", shopId)
    .order("scene_order", { ascending: true });

  if (scenesError) {
    throw new Error(scenesError.message);
  }

  const normalizedScenes = (scenes ?? []).map((scene) => ({
    ...scene,
    media_job: normalizeMediaJob(scene.media_job as any),
  }));

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={itemRaw.title}
      subtitle="Review one campaign angle, its prompt, media job, and publishing path."
      actions={
        <>
          {campaign?.id ? (
            <Link href={`/shopreel/campaigns/${campaign.id}`}>
              <GlassButton variant="ghost">Back to Campaign</GlassButton>
            </Link>
          ) : null}
          <form action={`/api/shopreel/campaigns/items/${id}/create-scene-jobs`} method="post">
            <GlassButton variant="secondary">Create Scene Jobs</GlassButton>
          </form>
          <form action={`/api/shopreel/campaigns/items/${id}/run-scene-jobs`} method="post">
            <GlassButton variant="secondary">Run Scene Jobs</GlassButton>
          </form>
          <form action={`/api/shopreel/campaigns/items/${id}/sync-scene-jobs`} method="post">
            <GlassButton variant="secondary">Sync Scene Jobs</GlassButton>
          </form>
          <form action={`/api/shopreel/campaigns/items/${id}/assemble`} method="post">
            <GlassButton variant="primary">Build 20s Final Ad</GlassButton>
          </form>
          {mediaJob?.source_content_piece_id ? (
            <Link href={`/shopreel/content/${mediaJob.source_content_piece_id}`}>
              <GlassButton variant="secondary">Open Content</GlassButton>
            </Link>
          ) : null}
          {mediaJob?.source_generation_id ? (
            <Link href={`/shopreel/editor/video/${mediaJob.source_generation_id}`}>
              <GlassButton variant="primary">Open Editor</GlassButton>
            </Link>
          ) : null}
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <GlassCard
          label="Angle"
          title="Campaign item summary"
          description="This is one content angle from the broader campaign."
          strong
        >
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{itemRaw.status}</GlassBadge>
              <GlassBadge tone="muted">{itemRaw.angle}</GlassBadge>
              <GlassBadge tone="muted">{itemRaw.aspect_ratio}</GlassBadge>
              {itemRaw.style ? <GlassBadge tone="muted">{itemRaw.style}</GlassBadge> : null}
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.primary
              )}
            >
              {itemRaw.prompt}
            </div>

            {itemRaw.negative_prompt ? (
              <div
                className={cx(
                  "rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.secondary
                )}
              >
                {itemRaw.negative_prompt}
              </div>
            ) : null}
          </div>
        </GlassCard>

        <GlassCard
          label="Media Job"
          title="Linked generation"
          description="Current render state and preview for this campaign item."
          strong
        >
          {!mediaJob ? (
            <div className={cx("text-sm", glassTheme.text.secondary)}>
              No media job linked yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <GlassBadge tone={mediaJob.status === "completed" ? "copper" : "default"}>
                  {mediaJob.status}
                </GlassBadge>
                <GlassBadge tone="muted">{mediaJob.provider}</GlassBadge>
              </div>

              {mediaJob.preview_url ? (
                <video
                  src={mediaJob.preview_url}
                  controls
                  playsInline
                  className="max-h-72 rounded-2xl border border-white/10"
                />
              ) : (
                <div className={cx("text-sm", glassTheme.text.secondary)}>
                  No preview yet.
                </div>
              )}

              {mediaJob.error_text ? (
                <div className={cx("text-sm", glassTheme.text.copperSoft)}>
                  {mediaJob.error_text}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ["Media Job ID", mediaJob.id],
                  ["Output Asset", mediaJob.output_asset_id ?? "—"],
                  ["Content Piece", mediaJob.source_content_piece_id ?? "—"],
                  ["Story Generation", mediaJob.source_generation_id ?? "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className={cx(
                      "rounded-2xl border p-4",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft
                    )}
                  >
                    <div className={cx("text-xs uppercase tracking-[0.18em]", glassTheme.text.muted)}>
                      {label}
                    </div>
                    <div className={cx("mt-2 text-sm break-all", glassTheme.text.primary)}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </section>

      <GlassCard
        label="Scenes"
        title="Scene plan"
        description="Each scene becomes its own generated clip before final assembly."
        strong
      >
        {normalizedScenes.length === 0 ? (
          <div className={cx("text-sm", glassTheme.text.secondary)}>
            No scenes created yet. Use Create Scene Jobs to build the multi-scene plan.
          </div>
        ) : (
          <div className="grid gap-3">
            {normalizedScenes.map((scene) => {
              const sceneJob = normalizeMediaJob(scene.media_job as any);

              return (
                <div
                  key={scene.id}
                  className={cx(
                    "rounded-2xl border p-4",
                    glassTheme.border.softer,
                    glassTheme.glass.panelSoft
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                        Scene {scene.scene_order}: {scene.title}
                      </div>
                      <div className={cx("text-xs", glassTheme.text.secondary)}>
                        {Number(scene.duration_seconds ?? 0)}s
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <GlassBadge tone="default">{scene.status}</GlassBadge>
                        {sceneJob?.status ? (
                          <GlassBadge tone={sceneJob.status === "completed" ? "copper" : "muted"}>
                            Job: {sceneJob.status}
                          </GlassBadge>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div
                    className={cx(
                      "mt-4 rounded-2xl border p-4 text-sm whitespace-pre-wrap",
                      glassTheme.border.softer,
                      glassTheme.glass.panelSoft,
                      glassTheme.text.primary
                    )}
                  >
                    {scene.prompt}
                  </div>

                  {sceneJob?.preview_url ? (
                    <div className="pt-4">
                      <video
                        src={sceneJob.preview_url}
                        controls
                        playsInline
                        className="max-h-56 rounded-2xl border border-white/10"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </GlassShell>
  );
}
