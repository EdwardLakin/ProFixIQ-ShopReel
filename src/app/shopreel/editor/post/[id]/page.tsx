import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export default async function ShopReelPostEditorPage(
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
  const post = objectRecord(textOutputs.post);
  const title = typeof post.title === "string" ? post.title : "Social post";
  const body = typeof post.body === "string" ? post.body : "No social post generated.";

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Social post editor"
      subtitle="Caption-first text output generated from the creator pipeline."
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
          label="Title"
          title={title}
          description="Social-post-specific content output."
          strong
        >
          <div className={cx("break-all text-sm", glassTheme.text.primary)}>{title}</div>
        </GlassCard>

        <GlassCard
          label="Draft"
          title="Post body"
          description="Text output ready for editorial refinement."
          strong
        >
          <pre className={cx("whitespace-pre-wrap text-sm leading-7", glassTheme.text.primary)}>
            {body}
          </pre>
        </GlassCard>
      </section>
    </GlassShell>
  );
}
