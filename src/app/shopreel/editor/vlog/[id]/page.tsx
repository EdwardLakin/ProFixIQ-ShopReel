import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import GlassBadge from "@/features/shopreel/ui/system/GlassBadge";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export default async function ShopReelVlogEditorPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const shopId = await getCurrentShopId();
  const supabase = createAdminClient();
  const legacy = supabase as any;

  const { data: generation, error } = await legacy
    .from("shopreel_story_generations")
    .select("*")
    .eq("id", id)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!generation) throw new Error("Generation not found");

  const metadata = objectRecord(generation.generation_metadata);
  const textOutputs = objectRecord(metadata.text_outputs);
  const vlog = objectRecord(textOutputs.vlog);

  const title = typeof vlog.title === "string" ? vlog.title : "Vlog draft";
  const hook = typeof vlog.hook === "string" ? vlog.hook : "No vlog hook generated.";
  const script = typeof vlog.script === "string" ? vlog.script : "No vlog script generated.";
  const closingCta =
    typeof vlog.closingCta === "string" ? vlog.closingCta : "No closing CTA generated.";
  const talkingPoints = Array.isArray(vlog.talkingPoints) ? vlog.talkingPoints : [];
  const bRoll = Array.isArray(vlog.bRoll) ? vlog.bRoll : [];
  const sceneOrder = Array.isArray(vlog.sceneOrder) ? vlog.sceneOrder : [];

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Vlog editor"
      subtitle="Longer-form video scripting output generated from the creator pipeline."
      actions={
        <>
          <Link href={`/shopreel/generations/${id}`}>
            <GlassButton variant="ghost">Back to review</GlassButton>
          </Link>
          <Link href="/shopreel/content">
            <GlassButton variant="secondary">Content library</GlassButton>
          </Link>
        </>
      }
    >
      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <GlassCard
          label="Overview"
          title={title}
          description="Vlog structure with hook, talking points, b-roll, and scene order."
          strong
        >
          <div className="space-y-4">
            <div
              className={cx(
                "rounded-2xl border p-4",
                glassTheme.border.copper,
                glassTheme.glass.panelSoft,
              )}
            >
              <div className={cx("text-sm", glassTheme.text.secondary)}>Hook</div>
              <div className={cx("mt-2 text-sm", glassTheme.text.primary)}>{hook}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              <GlassBadge tone="copper">{talkingPoints.length} talking points</GlassBadge>
              <GlassBadge tone="default">{bRoll.length} b-roll ideas</GlassBadge>
              <GlassBadge tone="muted">{sceneOrder.length} scenes</GlassBadge>
            </div>
          </div>
        </GlassCard>

        <GlassCard
          label="Script"
          title="Vlog script"
          description="Talking-head and b-roll-friendly scripting output."
          strong
        >
          <pre className={cx("whitespace-pre-wrap text-sm leading-7", glassTheme.text.primary)}>
            {script}
          </pre>
        </GlassCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <GlassCard
          label="Talking points"
          title="Main points"
          description="Use these as the spoken backbone of the vlog."
          strong
        >
          <div className="grid gap-3">
            {talkingPoints.map((point, index) => (
              <div
                key={`${point}-${index}`}
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.primary,
                )}
              >
                {point}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="B-roll"
          title="Suggested visuals"
          description="Quick shot list for filming."
          strong
        >
          <div className="grid gap-3">
            {bRoll.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className={cx(
                  "rounded-2xl border p-4 text-sm",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                  glassTheme.text.primary,
                )}
              >
                {item}
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard
          label="CTA"
          title="Closing CTA"
          description="End the vlog with a clear next step."
          strong
        >
          <div
            className={cx(
              "rounded-2xl border p-4 text-sm",
              glassTheme.border.copper,
              glassTheme.glass.panelSoft,
              glassTheme.text.primary,
            )}
          >
            {closingCta}
          </div>
        </GlassCard>
      </section>

      <GlassCard
        label="Scene order"
        title="Suggested flow"
        description="Film in this sequence for a clean vlog structure."
        strong
      >
        <div className="grid gap-3">
          {sceneOrder.map((scene, index) => {
            const record = objectRecord(scene);
            const sceneTitle =
              typeof record.title === "string" ? record.title : `Scene ${index + 1}`;
            const description =
              typeof record.description === "string" ? record.description : "No description";
            const durationLabel =
              typeof record.durationLabel === "string" ? record.durationLabel : "";

            return (
              <div
                key={`${sceneTitle}-${index}`}
                className={cx(
                  "grid gap-3 rounded-2xl border p-4 md:grid-cols-[auto_1fr_auto]",
                  glassTheme.border.softer,
                  glassTheme.glass.panelSoft,
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/80">
                  {index + 1}
                </div>
                <div className="space-y-1">
                  <div className={cx("text-sm font-medium", glassTheme.text.primary)}>
                    {sceneTitle}
                  </div>
                  <div className={cx("text-sm", glassTheme.text.secondary)}>
                    {description}
                  </div>
                </div>
                <div className={cx("text-sm", glassTheme.text.secondary)}>
                  {durationLabel}
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>
    </GlassShell>
  );
}
