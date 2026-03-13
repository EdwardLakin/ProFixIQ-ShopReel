import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import {
  generateBlogSection,
  type BlogRewriteStyle,
} from "@/features/shopreel/creator/generateBlogSection";

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

function rebuildBodyFromSections(sections: BlogSection[]) {
  return sections
    .map((section, index) => {
      if (index === 0) return section.body;
      return `## ${section.title}\n\n${section.body}`;
    })
    .join("\n\n");
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      title?: string;
      sections?: BlogSection[];
    };

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
    if (!generation) {
      return NextResponse.json({ ok: false, error: "Generation not found" }, { status: 404 });
    }

    const metadata = objectRecord(generation.generation_metadata);
    const textOutputs = objectRecord(metadata.text_outputs);
    const blog = objectRecord(textOutputs.blog);
    const sections = Array.isArray(body.sections) ? body.sections : asSections(blog.sections);

    const nextBlog = {
      ...blog,
      title:
        typeof body.title === "string" && body.title.trim().length > 0
          ? body.title.trim()
          : typeof blog.title === "string"
            ? blog.title
            : "Blog draft",
      sections,
      body: rebuildBodyFromSections(sections),
    };

    const nextMetadata = {
      ...metadata,
      text_outputs: {
        ...textOutputs,
        blog: nextBlog,
      },
    };

    const { error: updateError } = await legacy
      .from("shopreel_story_generations")
      .update({
        generation_metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("shop_id", shopId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true,
      blog: nextBlog,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to save blog",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      action?: "regenerate_section" | "improve_section";
      sectionKey?: string;
      rewriteStyle?: BlogRewriteStyle;
    };

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
    if (!generation) {
      return NextResponse.json({ ok: false, error: "Generation not found" }, { status: 404 });
    }

    const metadata = objectRecord(generation.generation_metadata);
    const textOutputs = objectRecord(metadata.text_outputs);
    const blog = objectRecord(textOutputs.blog);
    const sections = asSections(blog.sections);

    const validAction =
      body.action === "regenerate_section" || body.action === "improve_section";

    if (!validAction || !body.sectionKey) {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const sectionIndex = sections.findIndex((section) => section.key === body.sectionKey);
    if (sectionIndex === -1) {
      return NextResponse.json({ ok: false, error: "Section not found" }, { status: 404 });
    }

    const generatedScript =
      typeof metadata.generated_script === "object" &&
      metadata.generated_script &&
      !Array.isArray(metadata.generated_script)
        ? (metadata.generated_script as Record<string, unknown>)
        : {};

    const nextBody = await generateBlogSection({
      topic:
        typeof blog.title === "string" && blog.title.trim().length > 0
          ? blog.title
          : "Blog draft",
      sectionTitle: sections[sectionIndex]!.title,
      existingBody: sections[sectionIndex]!.body,
      allSections: sections,
      summary:
        typeof metadata.research_summary === "string" ? metadata.research_summary : "",
      hook: typeof generatedScript.hook === "string" ? generatedScript.hook : "",
      context: typeof generatedScript.context === "string" ? generatedScript.context : "",
      explanation:
        typeof generatedScript.explanation === "string" ? generatedScript.explanation : "",
      takeaway:
        typeof generatedScript.takeaway === "string" ? generatedScript.takeaway : "",
      cta: typeof generatedScript.cta === "string" ? generatedScript.cta : "",
      audience:
        typeof metadata.audience === "string" ? metadata.audience : null,
      blogStyle:
        typeof metadata.blog_style === "string" ? (metadata.blog_style as any) : "auto",
      blogLengthMode:
        typeof metadata.blog_length_mode === "string"
          ? (metadata.blog_length_mode as any)
          : "standard",
      rewriteStyle:
        body.action === "improve_section"
          ? "improve_writing"
          : body.rewriteStyle ?? null,
    });

    const nextSections = sections.map((section, index) =>
      index === sectionIndex ? { ...section, body: nextBody } : section,
    );

    const nextBlog = {
      ...blog,
      sections: nextSections,
      body: rebuildBodyFromSections(nextSections),
    };

    const nextMetadata = {
      ...metadata,
      text_outputs: {
        ...textOutputs,
        blog: nextBlog,
      },
    };

    const { error: updateError } = await legacy
      .from("shopreel_story_generations")
      .update({
        generation_metadata: nextMetadata,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("shop_id", shopId);

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true,
      blog: nextBlog,
      regeneratedSectionKey: body.sectionKey,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to regenerate section",
      },
      { status: 500 },
    );
  }
}
