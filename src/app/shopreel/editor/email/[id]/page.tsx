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

export default async function ShopReelEmailEditorPage(
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
  const email = objectRecord(textOutputs.email);
  const subject = typeof email.subject === "string" ? email.subject : "Email draft";
  const body = typeof email.body === "string" ? email.body : "No email body generated.";

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Email editor"
      subtitle="Email copy generated from the creator pipeline."
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
          label="Subject"
          title={subject}
          description="Email-specific content output."
          strong
        >
          <div className={cx("break-all text-sm", glassTheme.text.primary)}>{subject}</div>
        </GlassCard>

        <GlassCard
          label="Draft"
          title="Email body"
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
