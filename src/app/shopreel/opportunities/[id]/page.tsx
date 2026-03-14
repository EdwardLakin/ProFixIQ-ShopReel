import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import ShopReelNav from "@/features/shopreel/ui/ShopReelNav";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { getEditorPath } from "@/features/shopreel/lib/editorPaths";

type Params = {
  params: Promise<{ id: string }>;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function formatLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

type OpportunityRow = {
  id: string;
  shop_id: string;
  story_source_id: string;
  score: number | null;
  status: string;
  reason: string | null;
  metadata: unknown;
};

type SourceRow = {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  origin: string;
  tags: string[] | null;
  created_at: string;
};

type GenerationRow = {
  id: string;
  status: string;
  created_at: string;
  story_draft: unknown;
  generation_metadata: unknown;
  render_job_id: string | null;
  content_piece_id: string | null;
};

export default async function ShopReelOpportunityDetailPage({ params }: Params) {
  const { id } = await params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: opportunity, error: opportunityError } = await legacy
    .from("shopreel_content_opportunities")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (opportunityError || !opportunity) notFound();

  const typedOpportunity = opportunity as OpportunityRow;

  const { data: source, error: sourceError } = await legacy
    .from("shopreel_story_sources")
    .select("id, title, description, kind, origin, tags, created_at")
    .eq("id", typedOpportunity.story_source_id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (sourceError || !source) notFound();

  const typedSource = source as SourceRow;

  const opportunityMetadata = objectRecord(typedOpportunity.metadata);
  const metadataGenerationId =
    typeof opportunityMetadata.last_generation_id === "string"
      ? opportunityMetadata.last_generation_id
      : typeof opportunityMetadata.generation_id === "string"
        ? opportunityMetadata.generation_id
        : null;

  let generation: GenerationRow | null = null;

  if (metadataGenerationId) {
    const { data: generationData } = await legacy
      .from("shopreel_story_generations")
      .select("id, status, created_at, story_draft, generation_metadata, render_job_id, content_piece_id")
      .eq("id", metadataGenerationId)
      .eq("shop_id", shopId)
      .maybeSingle();

    generation = (generationData ?? null) as GenerationRow | null;
  } else {
    const { data: generationData } = await legacy
      .from("shopreel_story_generations")
      .select("id, status, created_at, story_draft, generation_metadata, render_job_id, content_piece_id")
      .eq("story_source_id", typedSource.id)
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    generation = (generationData ?? null) as GenerationRow | null;
  }

  const draft = objectRecord(generation?.story_draft);
  const generationMetadata = objectRecord(generation?.generation_metadata);
  const outputType =
    typeof generationMetadata.output_type === "string"
      ? generationMetadata.output_type
      : "video";

  const caption =
    typeof draft.caption === "string"
      ? draft.caption
      : typedSource.description ?? "No caption generated";

  const hook =
    typeof draft.hook === "string"
      ? draft.hook
      : "No hook generated";

  const cta =
    typeof draft.cta === "string"
      ? draft.cta
      : "No CTA generated";

  const scriptText =
    typeof draft.scriptText === "string"
      ? draft.scriptText
      : "No script text generated";

  const voiceoverText =
    typeof draft.voiceoverText === "string"
      ? draft.voiceoverText
      : "No voiceover text generated";

  const renderUrl =
    typeof generationMetadata.render_url === "string"
      ? generationMetadata.render_url
      : null;

  const platformTargets = Array.isArray(draft.platformTargets)
    ? (draft.platformTargets as string[])
    : [];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title={typedSource.title ?? "Untitled opportunity"}
      subtitle="Review the opportunity, linked source, and latest generated output."
      actions={
        <div className="flex flex-wrap gap-3">
          {generation ? (
            <>
              <Link href={`/shopreel/generations/${generation.id}`}>
                <GlassButton variant="ghost">Review generation</GlassButton>
              </Link>
              <Link href={getEditorPath(outputType, generation.id)}>
                <GlassButton variant="secondary">Open editor</GlassButton>
              </Link>
            </>
          ) : null}
        </div>
      }
    >
      <ShopReelNav />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <GlassCard
          label="Overview"
          title="Opportunity summary"
          description="Review the ranked opportunity, source, and current state."
          strong
        >
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="default">{formatLabel(typedOpportunity.status)}</GlassBadge>
              <GlassBadge tone="muted">{formatLabel(typedSource.kind)}</GlassBadge>
              <GlassBadge tone="muted">{formatLabel(typedSource.origin)}</GlassBadge>
              <GlassBadge tone={(typedOpportunity.score ?? 0) >= 85 ? "copper" : "default"}>
                Score {typedOpportunity.score != null ? Math.round(typedOpportunity.score) : "--"}
              </GlassBadge>
              {generation ? (
                <GlassBadge tone="copper">{formatLabel(outputType)}</GlassBadge>
              ) : null}
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Hook</div>
              <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                {hook}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Caption</div>
              <div className={cx("mt-1 text-sm leading-6", glassTheme.text.primary)}>
                {caption}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>CTA</div>
              <div className={cx("mt-1 text-sm leading-6", glassTheme.text.primary)}>
                {cta}
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Delivery"
          title="Source and output"
          description="Story source details and latest generation state."
          strong
        >
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Created</div>
              <div className={cx("mt-1 text-base font-medium", glassTheme.text.primary)}>
                {new Date(typedSource.created_at).toLocaleString()}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Platform targets</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {platformTargets.length > 0 ? (
                  platformTargets.map((platform) => (
                    <GlassBadge key={platform} tone="default">
                      {platform}
                    </GlassBadge>
                  ))
                ) : (
                  <span className={cx("text-sm", glassTheme.text.secondary)}>
                    No platform targets set
                  </span>
                )}
              </div>
            </div>

            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.softer,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Render output</div>
              <div className={cx("mt-1 text-sm", glassTheme.text.primary)}>
                {renderUrl ? "Render available" : "No render output yet"}
              </div>
            </div>

            {typedOpportunity.reason ? (
              <div
                className={cx(
                  "rounded-2xl border p-4",
                  glassTheme.border.copper,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className={cx("text-sm", glassTheme.text.secondary)}>Why this ranked</div>
                <div className={cx("mt-1 text-sm", glassTheme.text.primary)}>
                  {typedOpportunity.reason}
                </div>
              </div>
            ) : null}
          </div>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <GlassCard
          label="Script"
          title="Script text"
          description="Generated long-form concept text for review."
          strong
        >
          <div className={cx("whitespace-pre-wrap text-sm leading-6", glassTheme.text.primary)}>
            {scriptText}
          </div>
        </GlassCard>

        <GlassCard
          label="Voiceover"
          title="Voiceover text"
          description="Generated spoken version used for reel planning."
          strong
        >
          <div className={cx("whitespace-pre-wrap text-sm leading-6", glassTheme.text.primary)}>
            {voiceoverText}
          </div>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
