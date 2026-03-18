import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import type { Json } from "@/types/supabase";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getJsonString(value: Json | null | undefined, key: string): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  return typeof record[key] === "string" ? (record[key] as string) : null;
}

export default async function ShopReelContentPieceDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: contentPiece, error: contentPieceError } = await supabase
    .from("content_pieces")
    .select("*")
    .eq("id", id)
    .eq("tenant_shop_id", shopId)
    .maybeSingle();

  if (contentPieceError) {
    throw new Error(contentPieceError.message);
  }

  if (!contentPiece) {
    return (
      <GlassShell
        eyebrow="ShopReel"
        title="Content piece not found"
        subtitle="This content piece does not exist for the current workspace."
      >
        <ShopReelNav />
        <GlassCard strong>
          <div className={cx("text-sm", glassTheme.text.secondary)}>No content piece found.</div>
        </GlassCard>
      </GlassShell>
    );
  }

  const metadata = objectRecord(contentPiece.metadata);
  const mediaGenerationJobId =
    typeof metadata.media_generation_job_id === "string"
      ? metadata.media_generation_job_id
      : null;

  const outputAssetId =
    typeof metadata.output_asset_id === "string"
      ? metadata.output_asset_id
      : null;

  const { data: linkedAsset } = outputAssetId
    ? await supabase
        .from("content_assets")
        .select("*")
        .eq("id", outputAssetId)
        .eq("tenant_shop_id", shopId)
        .maybeSingle()
    : { data: null };

  const { data: linkedMediaJob } = mediaGenerationJobId
    ? await supabase
        .from("shopreel_media_generation_jobs")
        .select("*")
        .eq("id", mediaGenerationJobId)
        .eq("shop_id", shopId)
        .maybeSingle()
    : { data: null };

  const { data: linkedGeneration } = await legacy
    .from("shopreel_story_generations")
    .select("id, status, updated_at")
    .eq("content_piece_id", contentPiece.id)
    .eq("shop_id", shopId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const renderUrl =
    contentPiece.render_url ??
    linkedMediaJob?.preview_url ??
    linkedAsset?.public_url ??
    null;

  const thumbnailUrl =
    contentPiece.thumbnail_url ??
    getJsonString(linkedAsset?.metadata ?? null, "thumbnail_url") ??
    null;

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={contentPiece.title}
      subtitle="Review generated media, linked pipeline records, and jump into the next action."
      actions={
        <>
          {linkedGeneration?.id ? (
            <Link href={`/shopreel/editor/video/${linkedGeneration.id}`}>
              <GlassButton variant="primary">Open editor</GlassButton>
            </Link>
          ) : null}
          <Link href="/shopreel/publish-center">
            <GlassButton variant="secondary">Publish Center</GlassButton>
          </Link>
          <Link href="/shopreel/content">
            <GlassButton variant="ghost">Back to Library</GlassButton>
          </Link>
        </>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <GlassCard
          label="Preview"
          title="Content output"
          description="Primary generated media linked to this content piece."
          strong
        >
          {renderUrl ? (
            contentPiece.content_type?.includes("visual") ? (
              <img
                src={renderUrl}
                alt={contentPiece.title}
                className="w-full rounded-2xl border border-white/10 object-cover"
              />
            ) : (
              <video
                src={renderUrl}
                controls
                playsInline
                poster={thumbnailUrl ?? undefined}
                className="w-full rounded-2xl border border-white/10 bg-black/30"
              />
            )
          ) : (
            <div
              className={cx(
                "rounded-2xl border p-6 text-sm",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
                glassTheme.text.secondary
              )}
            >
              No preview asset is linked yet.
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <GlassBadge tone="default">{formatLabel(contentPiece.status)}</GlassBadge>
            {contentPiece.content_type ? (
              <GlassBadge tone="muted">{formatLabel(contentPiece.content_type)}</GlassBadge>
            ) : null}
            {linkedGeneration?.id ? <GlassBadge tone="copper">Editable story linked</GlassBadge> : null}
            {linkedMediaJob?.id ? <GlassBadge tone="copper">Media job linked</GlassBadge> : null}
          </div>
        </GlassCard>

        <GlassCard
          label="Details"
          title="Content summary"
          description="The current content piece record driving review and publishing."
        >
          <div className="grid gap-3">
            {[
              ["Content Piece ID", contentPiece.id],
              ["Media Job", linkedMediaJob?.id ?? "—"],
              ["Story Generation", linkedGeneration?.id ?? "—"],
              ["Output Asset", linkedAsset?.id ?? outputAssetId ?? "—"],
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
        </GlassCard>
      </section>

      <GlassCard
        label="Copy"
        title="Text fields"
        description="Current hook, caption, CTA, and script values attached to the content piece."
        strong
      >
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Hook", contentPiece.hook ?? "—"],
            ["CTA", contentPiece.cta ?? "—"],
            ["Caption", contentPiece.caption ?? "—"],
            ["Script", contentPiece.script_text ?? contentPiece.voiceover_text ?? "—"],
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
              <div className={cx("mt-2 text-sm whitespace-pre-wrap", glassTheme.text.primary)}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard
        label="Actions"
        title="Next best actions"
        description="Follow the cleanest route from generated output to editable story and publishing."
        strong
      >
        <div className="flex flex-wrap gap-3">
          {linkedGeneration?.id ? (
            <Link href={`/shopreel/editor/video/${linkedGeneration.id}`}>
              <GlassButton variant="primary">Continue editing</GlassButton>
            </Link>
          ) : (
            <Link href="/shopreel/video-creation">
              <GlassButton variant="primary">Convert in Video Creation</GlassButton>
            </Link>
          )}

          <Link href="/shopreel/publish-center">
            <GlassButton variant="secondary">Prepare for publishing</GlassButton>
          </Link>

          <Link href="/shopreel/content">
            <GlassButton variant="ghost">Return to Library</GlassButton>
          </Link>
        </div>
      </GlassCard>
    </GlassShell>
  );
}
