import Link from "next/link";
import GlassShell from "@/features/shopreel/ui/system/GlassShell";
import GlassCard from "@/features/shopreel/ui/system/GlassCard";
import GlassButton from "@/features/shopreel/ui/system/GlassButton";
import BlogEditorClient from "@/features/shopreel/editor/components/BlogEditorClient";
import { glassTheme, cx } from "@/features/shopreel/ui/system/glassTheme";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";

type BlogSection = {
  key: string;
  title: string;
  body: string;
};

function objectRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function asSections(value: unknown): BlogSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => {
      if (!section || typeof section !== "object" || Array.isArray(section)) return null;
      const record = section as Record<string, unknown>;
      if (
        typeof record.key !== "string" ||
        typeof record.title !== "string" ||
        typeof record.body !== "string"
      ) {
        return null;
      }
      return {
        key: record.key,
        title: record.title,
        body: record.body,
      };
    })
    .filter((section): section is BlogSection => !!section);
}

export default async function ShopReelBlogEditorPage(
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
  const blog = objectRecord(textOutputs.blog);
  const title = typeof blog.title === "string" ? blog.title : "Blog draft";
  const body = typeof blog.body === "string" ? blog.body : "No blog body generated.";
  const sections = asSections(blog.sections);

  return (
    <GlassShell
      eyebrow="ShopReel"
      title="Blog editor"
      subtitle="Section-based editing for long-form output."
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
      {sections.length > 0 ? (
        <BlogEditorClient
          generationId={id}
          initialTitle={title}
          initialSections={sections}
          initialBody={body}
        />
      ) : (
        <GlassCard
          label="Draft"
          title={title}
          description="No section structure was found for this blog generation."
          strong
        >
          <div className={cx("whitespace-pre-wrap text-sm leading-7", glassTheme.text.primary)}>
            {body}
          </div>
        </GlassCard>
      )}
    </GlassShell>
  );
}
