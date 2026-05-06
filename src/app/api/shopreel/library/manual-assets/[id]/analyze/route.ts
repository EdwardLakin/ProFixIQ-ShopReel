import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getCurrentShopId } from "@/features/shopreel/server/getCurrentShopId";
import { openai } from "@/features/ai/server/openai";
import { SHOPREEL_AI_MODELS } from "@/features/shopreel/ai/modelConfig";

type ManualAsset = {
  id: string;
  shop_id: string | null;
  created_by: string | null;
  title: string | null;
  description: string | null;
  asset_type: string;
  content_goal: string | null;
  note: string | null;
};

type ManualAssetFile = {
  id: string;
  file_name: string | null;
  mime_type: string | null;
  file_size_bytes: number | null;
  storage_path: string;
  bucket: string;
  sort_order: number;
};

type AssetAnalysis = {
  summary: string;
  tags: string[];
  useCases: string[];
  contentIdeas: string[];
  bestFormats: string[];
  recommendedPrompt: string;
};

type UnsafeSupabase = ReturnType<typeof createAdminClient> & {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string | number | boolean | null): {
        maybeSingle(): Promise<{ data: ManualAsset | null; error: { message: string } | null }>;
        order(column: string, options?: { ascending?: boolean }): {
          limit(count: number): Promise<{ data: ManualAssetFile[] | null; error: { message: string } | null }>;
        };
      };
    };
    update(values: Record<string, unknown>): {
      eq(column: string, value: string): {
        select(columns: string): {
          single(): Promise<{ data: unknown; error: { message: string } | null }>;
        };
      };
    };
  };
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
        .slice(0, 20)
    : [];
}

function normalizeAnalysis(value: unknown, asset: ManualAsset, files: ManualAssetFile[]): AssetAnalysis {
  const record = asRecord(value);
  const fileNames = files
    .map((file) => file.file_name)
    .filter((name): name is string => typeof name === "string" && name.trim().length > 0);

  const fallbackSummary =
    asset.description ||
    asset.note ||
    `Uploaded ${asset.asset_type} asset${fileNames.length ? ` with files: ${fileNames.join(", ")}` : ""}.`;

  return {
    summary: asString(record.summary, fallbackSummary),
    tags: asStringArray(record.tags),
    useCases: asStringArray(record.useCases),
    contentIdeas: asStringArray(record.contentIdeas),
    bestFormats: asStringArray(record.bestFormats),
    recommendedPrompt: asString(
      record.recommendedPrompt,
      `Create platform-ready content using this uploaded asset: ${asset.title ?? "Untitled upload"}.`,
    ),
  };
}

async function getScope() {
  const authSupabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await authSupabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Please sign in to analyze library assets.");
  }

  let shopId: string | null = null;
  try {
    shopId = await getCurrentShopId();
  } catch {
    shopId = null;
  }

  return { userId: user.id, shopId };
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { userId, shopId } = await getScope();
    const supabase = createAdminClient() as UnsafeSupabase;

    const { data: asset, error: assetError } = await supabase
      .from("shopreel_manual_assets")
      .select("id, shop_id, created_by, title, description, asset_type, content_goal, note")
      .eq("id", id)
      .maybeSingle();

    if (assetError) throw new Error(assetError.message);
    if (!asset) {
      return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
    }

    const canAccess =
      asset.created_by === userId ||
      Boolean(shopId && asset.shop_id === shopId);

    if (!canAccess) {
      return NextResponse.json({ ok: false, error: "Asset not found." }, { status: 404 });
    }

    const { data: files, error: filesError } = await supabase
      .from("shopreel_manual_asset_files")
      .select("id, file_name, mime_type, file_size_bytes, storage_path, bucket, sort_order")
      .eq("asset_id", asset.id)
      .order("sort_order", { ascending: true })
      .limit(20);

    if (filesError) throw new Error(filesError.message);

    const safeFiles: ManualAssetFile[] = files ?? [];
    const fileSummary = safeFiles.map((file: ManualAssetFile) => ({
      fileName: file.file_name,
      mimeType: file.mime_type,
      sizeBytes: file.file_size_bytes,
      sortOrder: file.sort_order,
    }));

    const response = await openai.responses.create({
      model: SHOPREEL_AI_MODELS.text,
      input: [
        {
          role: "system",
          content:
            "You analyze uploaded media library assets for a universal AI content creation product. " +
            "Return one JSON object only. Be concise, practical, and creator/business focused. " +
            "Do not assume auto-repair unless asset metadata says so.",
        },
        {
          role: "user",
          content:
            "Analyze this asset record and suggest content use cases.\n\n" +
            JSON.stringify({
              asset: {
                title: asset.title,
                description: asset.description,
                assetType: asset.asset_type,
                contentGoal: asset.content_goal,
                note: asset.note,
              },
              files: fileSummary,
              expectedShape: {
                summary: "one short paragraph",
                tags: ["short tags"],
                useCases: ["ways this asset can be used"],
                contentIdeas: ["specific content ideas"],
                bestFormats: ["Reel, social post, blog, campaign, vlog, etc."],
                recommendedPrompt: "a create-ready prompt",
              },
            }),
        },
      ],
      text: {
        format: { type: "json_object" },
      },
    });

    const analysis = normalizeAnalysis(
      JSON.parse(response.output_text || "{}") as unknown,
      asset,
      safeFiles,
    );

    const { data: updated, error: updateError } = await supabase
      .from("shopreel_manual_assets")
      .update({
        ai_summary: analysis.summary,
        ai_tags: analysis.tags,
        ai_use_cases: analysis.useCases,
        ai_analysis: analysis,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", asset.id)
      .select("id")
      .single();

    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({
      ok: true,
      asset: updated,
      analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to analyze asset.",
      },
      { status: 500 },
    );
  }
}
