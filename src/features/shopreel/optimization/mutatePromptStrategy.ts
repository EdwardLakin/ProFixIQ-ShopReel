import { createAdminClient } from "@/lib/supabase/server";
import { getOptimizationSnapshot } from "./getOptimizationSnapshot";

function buildHookRules(snapshot: Awaited<ReturnType<typeof getOptimizationSnapshot>>) {
  const rules: string[] = [];

  if (snapshot.preferredContentTypes.includes("before_after")) {
    rules.push("Prioritize before/after contrast in hooks when available.");
  }

  if (snapshot.preferredContentTypes.includes("educational_tip")) {
    rules.push("Prefer clear educational hooks tied to real findings.");
  }

  if (snapshot.winningHookPatterns.some((item) => item.includes("inspection"))) {
    rules.push("Lean into inspection-based trust and findings language.");
  }

  rules.push("Keep hooks concise and specific to the real event.");
  rules.push("Prefer proof-driven language over generic hype.");
  rules.push("Use numbers, contrast, or findings when supported by the source.");

  return rules;
}

function buildCtaRules(snapshot: Awaited<ReturnType<typeof getOptimizationSnapshot>>) {
  const rules: string[] = [];

  if (snapshot.preferredContentTypes.includes("repair_story")) {
    rules.push("Use low-friction CTAs focused on trust and follow-up.");
  }

  rules.push("Avoid heavy sales CTAs unless performance data strongly supports them.");
  rules.push("Prefer save/share/follow CTAs for educational and before/after content.");

  return rules;
}

export async function mutatePromptStrategy(shopId: string) {
  const supabase = createAdminClient();
  const snapshot = await getOptimizationSnapshot(shopId);

  const hookRules = buildHookRules(snapshot);
  const ctaRules = buildCtaRules(snapshot);

  const strategy = {
    updatedAt: new Date().toISOString(),
    preferredContentTypes: snapshot.preferredContentTypes,
    hookRules,
    ctaRules,
    winningPatterns: snapshot.winningHookPatterns,
    contentTypeBoosts: snapshot.contentTypeBoosts,
  };

  await supabase
    .from("shop_marketing_memory")
    .upsert(
      {
        shop_id: shopId,
        memory_key: "prompt_strategy",
        memory_value: strategy,
        source_type: "optimization_mutation",
        confidence: 0.88,
        updated_at: new Date().toISOString(),
      } as never,
      { onConflict: "shop_id,memory_key" },
    );

  const { data: templates, error: templatesError } = await supabase
    .from("content_templates")
    .select("id, config")
    .eq("tenant_shop_id", shopId)
    .eq("is_active", true);

  if (templatesError) {
    throw new Error(templatesError.message);
  }

  for (const template of (templates ?? []) as Array<{
    id: string;
    config: Record<string, unknown> | null;
  }>) {
    const config = template.config ?? {};

    const nextConfig = {
      ...config,
      optimization_rules: {
        hookRules,
        ctaRules,
        updatedAt: new Date().toISOString(),
      },
    };

    await supabase
      .from("content_templates")
      .update({
        config: nextConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", template.id);
  }

  return strategy;
}
